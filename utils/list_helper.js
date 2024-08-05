const _ = require('lodash');

const dummy = (blogs) => {
    return 1
}

const totalLikes = (blogs) => {
    const reducer = (sum, blog) => {
        return sum + blog.likes
    }
    return blogs.reduce(reducer, 0)
}

const favoriteBlog = (blogs) => {
    const reducer = (favorite, blog) => {
        return favorite.likes > blog.likes ? favorite : blog
    }
    return blogs.reduce(reducer, 0)
}


const mostBlogs = (blogs) => {
    const authorBlogCounts = _(blogs)
        .groupBy('author')
        .map((blogs, author) =>  ({author, blogs: blogs.length }))
        .value();
    
    return _.maxBy(authorBlogCounts, "blogs")
}

const mostLikes = (blogs) => {
    const authorBlogCounts = _(blogs)
        .groupBy('author')
        // .value();
        .map((blogs, author) =>  (
            {
                author, 
                likes: _.sumBy(blogs, "likes")
            })).value()
    return _.maxBy(authorBlogCounts, "likes")
}

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
    mostBlogs,
    mostLikes
}