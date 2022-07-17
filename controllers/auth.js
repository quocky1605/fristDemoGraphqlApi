const User = require('../models/user')
const { validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

exports.signUp = (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed')
        error.statusCode = 422
        error.data = errors.array()
        throw error
    }
    console.log(errors)
    const email = req.body.email
    const name = req.body.name
    const password = req.body.password

    console.log(req.body)
    bcrypt.hash(password, 12)
        .then(hashedPw => {
            const user = new User({
                email: email,
                password: hashedPw,
                name: name
            })
            return user.save()
        })
        .then(result => {
            res.status(201).json({ message: 'User created', userId: result._id })
        })
        .catch(err => {
            console.log(err)
            if (!err.statusCode) {
                err.statusCode = 500
            }
            next(err)
        })
}


exports.login = (req,res,next)=>{
    const email = req.body.email
    const password = req.body.password
    let loadedUser
    User.findOne({email:email})
        .then(user=>{
            if(!user){
                const error = new Error('Can not found your user Email')
                error.statusCode= 401
                throw Error
            }
            loadedUser = user
            console.log(user)
            return bcrypt.compare(password, user.password)
        })
        .then(isEqual=>{
            if(!isEqual){
                const error = new Error('Wrong password')
                error.statusCode = 401
                throw error
            }
            const token = jwt.sign ({
                email:loadedUser.email,
                userId:loadedUser._id.toString()
            },'randomToken',{expiresIn:'1h'})
            return res.status(200).json({token,userId:loadedUser._id.toString()})
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500
            }
            next(err)
        })
}