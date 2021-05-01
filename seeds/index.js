const mongoose = require('mongoose')
const cities = require('./cities')
const { descriptors, places } = require('./titles')
const Campground = require('../modals/campground')






mongoose.connect('mongodb://localhost:27017/myApp', { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true })
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log('Seeds/index/Database connected!')
});




const sample = array => array[Math.floor(Math.random() * array.length)]

// const seedDB = async() => {
//     await Campground.deleteMany({})
//     for (let i = 0; i < 3; i++) {
//         const rand1000 = Math.floor(Math.random() * 1000)
//         let camp = new Campground({
//             title: `${sample(descriptors)} ${sample(places)}`,
//             location: `${cities[rand1000].city}, ${cities[rand1000].state}`,
//             description: 'a good place to rest!',
//             image: 'https://source.unsplash.com/collection/483251/1600x900',
//             price: rand1000 / 10,
//             author: "60808d6903847a313057c721",



//         })
//         await camp.save()
//     }
// }





const seedDB = async() => {
    await Campground.deleteMany({});
    for (let i = 0; i < 30; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20) + 10;
        const camp = new Campground({
            //YOUR USER ID
            author: '60896b4f70665c0f88e76507',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quibusdam dolores vero perferendis laudantium, consequuntur voluptatibus nulla architecto, sit soluta esse iure sed labore ipsam a cum nihil atque molestiae deserunt!',
            price,
            geometry: {
                type: "Point",
                coordinates: [
                    cities[random1000].longitude,
                    cities[random1000].latitude,
                ]
            },
            image: {
                url: 'https://res.cloudinary.com/https-res-cloudinary-com-massigy-images/image/upload/v1619876269/CampShop/FB_IMG_1537891494422_yvlqpr.jpg',
                filename: 'YelpCamp/ahfnenvca4tha00h2ubt'
            },
        })
        await camp.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close()
})













// // seedDB()