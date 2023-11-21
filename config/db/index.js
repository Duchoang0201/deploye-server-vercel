const mongoose = require('mongoose')

async function connect () {
    try{
        await mongoose.connect('mongodb://127.0.0.1:27017/test');
        console.log('connect sucess')
    } catch ( error ) {
        console.log('connect fail')
    }
}

module.exports = { connect }    