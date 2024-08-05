// const PORT = 3003
// const MONGODB_URI = "mongodb+srv://fullstack:fullstack@cluster0.herkpup.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
require('dotenv').config()

let PORT = process.env.PORT
// let MONGODB_URI = process.env.MONGODB_URI
const MONGODB_URI = process.env.NODE_ENV === 'test' 
  ? process.env.TEST_MONGODB_URI
  : process.env.MONGODB_URI

module.exports = {
    PORT,
    MONGODB_URI
}