const Campground = require('../../modals/campground');
const User = require('../../modals/user');
const { dataValidator, campValidator } = require('../../tools/validators')
const { cloudinary } = require('../../cloudinary/index')
const mbxSDK = require('@mapbox/mapbox-sdk');
const mbxGeoCoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mbxToken = process.env.mapbox_token;
const geoCoder = mbxGeoCoding({ accessToken: mbxToken })



module.exports.allCamps = async (req, res) => {

    // fetch only some campground to be faster
    const campgrounds = await Campground.find({}).limit(18);
    res.render('campgrounds.ejs', { campgrounds });
}



module.exports.renderNewForm = (req, res) => {
    res.render('createCampground.ejs')
}

module.exports.renderEditForm = async (req, res) => {

    // get the campground data, and then inject them to the edit form
    const theCampground = await Campground.findById(req.params.id)
    res.render('editCampground.ejs', { theCampground })
}

module.exports.showPage = async (req, res) => {

    // fetch the campground & its reviews
    const theCampground = await Campground.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'owner',
            modal: User,
        }
    })
    res.render('theCampground.ejs', { theCampground })
}




module.exports.postNewCamp = async (req, res) => {

    // validate the data;
    dataValidator(campValidator, req.body);


    // get the geocoded campground location
    const geoData = await geoCoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 1,
    }).send()

    // create a new instance of a campground
    const newCamp = new Campground(req.body.campground);

    // add the geocoded location to it (for the map)
    newCamp.geometry = geoData.body.features[0].geometry
    newCamp.author = req.user._id;

    // add the image for the new campground (for the cloud service)
    newCamp.image = new Object({
        url: req.file.path,
        filename: req.file.filename
    })

    // find the the user & then push to it the new camp
    const user = await User.findOne(req.user);
    user.postedCampgrounds.unshift(newCamp);


    // save the new camp the the modified user concurrently
    await Promise.allSettled([
        newCamp.save(),
        user.save(),
    ])

    // informe the user & redirect
    req.flash('success', 'Successfully Created Campground');
    res.redirect(`/campgrounds/${newCamp._id}`)
}

module.exports.postEditCamp = async (req, res) => {

    // valide the data
    dataValidator(campValidator, req.body);

    // get the geocoded camp location
    const geoData = await geoCoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 1,
    }).send()

    let { id } = req.params;

    // add the geocoded location data 
    req.body.campground.geometry = geoData.body.features[0].geometry

    // add the new image 
    req.body.campground.image = new Object({
        url: req.file.path,
        filename: req.file.filename
    })


    // theCampToEdit is the camp before the update
    let theCampToEdit = await Campground.findByIdAndUpdate(id, req.body.campground, { runValidators: true })

    // remove the preivous image on the cloud
    await cloudinary.uploader.destroy(theCampToEdit.image.filename)

    // flash & redirect to the campground detail page
    req.flash('success', 'Successfully Uptaded Campground')
    res.redirect(`/campgrounds/${id}`)

}



module.exports.deleteCamp = async (req, res) => {


    let { id } = req.params;

    // get the camp & its author
    const campToDelete = await Campground.findByIdAndDelete(id)
    const fetchedUser = await User.findById(campToDelete.author)

    // remove the camp from the author posted camps list
    let campToDeleteIndex = fetchedUser.postedCampgrounds.indexOf(campToDelete._id)
    fetchedUser.postedCampgrounds.splice(campToDeleteIndex, 1);

    // conccurently save the modifies user & destroy the image on the cloud 
    Promise.allSettled([
        fetchedUser.save(),
        cloudinary.uploader.destroy(campToDelete.image.filename)
    ]);

    // flash & redirect to main page
    req.flash('success', 'Successfully Deleted Campground')
    res.redirect(`/campgrounds`)
}


module.exports.search = async (req, res) => {

    // get the search query
    const { searchedInput } = req.body

    // fetch using a regex following the query
    const campgrounds = await Campground.find({ location: { $regex: `.*${searchedInput}.*` } })

    if (campgrounds.length > 0) {

        // if any results, render them
        res.render('campgrounds.ejs', { campgrounds })

    } else {

        // else, go back to main page
        req.flash('danger', 'Not Found (Please Search by Location)');
        res.redirect('/campgrounds')

    }
}



// for the new version of the app -- camp-shop-redesign


module.exports.get_all_camp_json = async (req, res) => {


    // the select method will take the queried documents and exclude or include feilds
    // look up the select method on the mongoose docs
    const campgrounds = await Campground
        .find({})
        .select("-image -description -author -reviews -geometry -properties");

    res.status(200).send(campgrounds);
}






module.exports.query_then_send = async (req, res) => {

    // get the query from the url
    const { query } = req.params;

    // get the campground using the query
    const campgrounds = await Campground
        .find({ location: { $regex: `.*${query}.*`, $options: 'i' } })
        .select("-image -description -author -reviews -geometry -properties");

    if (campgrounds.length > 0) {

        // if any send them back as a response
        res.status(200).send(campgrounds);

    } else {

        // otherwise, send an error message
        res.status(404).send({ "error": "Nothing Was Found" });
    }
}