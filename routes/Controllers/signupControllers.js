const User = require('../../modals/user');
const { userValidator, dataValidator } = require('../../tools/validators')

module.exports.renderSignupForm = (req, res) => {
    if (req.session.isSignedIn != null) {
        req.flash('danger', 'You are Already SignedIn')
        res.redirect('/campgrounds')
    } else {
        res.render('signup.ejs')
    }
}


module.exports.postSignup = async(req, res) => {
    dataValidator(userValidator, req.body);
    const { email, username, password } = req.body.user;
    const fetchedUser = await User.findOne({ username })
    const secondFetchedUser = await User.findOne({ email })
    if (!fetchedUser && !secondFetchedUser) {
        const newUser = await new User({ email, username });
        const newSignup = await User.register(newUser, password)
        req.session.isSignedIn = newSignup.username
        req.login(newSignup, (err) => {
            if (err) {
                req.flash('danger', err);
                res.redirect('/campgrounds')
            }
            req.flash('success', 'Successfully SignedIn & LoggedIn')
            res.redirect('/campgrounds')
        })
    } else {
        if (fetchedUser) {
            req.flash('danger', 'Username  Already taken')
        }
        if (secondFetchedUser) {
            req.flash('danger', ' Email Already taken ')
        }
        res.redirect('/Signup')
    }
}