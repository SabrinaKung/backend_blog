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
    return blogs.reduce(reducer, {})
}

/* This also works

const mostBlogs = (blogs) => {
    if (blogs.length === 0) return null;

    const authorBlogCounts = _(blogs)
        .groupBy('author')
        .map((blogs, author) =>  ({author, blogs: blogs.length }))
        .value();
    
    return _.maxBy(authorBlogCounts, "blogs")
}

const mostLikes = (blogs) => {
    if (blogs.length === 0) return null;

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
*/

const mostBlogs = (blogs) => {
    if (!blogs.length) {
        return null
    }

    const authors = blogs.reduce((acc, blog) => {
        acc[blog.author] = (acc[blog.author] || 0) + 1
        return acc;
    }, {});

    let maxAuthor = Object.keys(authors)[0]

    for (const author in authors) {
        if (authors[author] > authors[maxAuthor]) {
            maxAuthor = author
        }
    }

    return {
        author: maxAuthor,
        blogs: authors[maxAuthor]
    }
}

const mostLikes = (blogs) => {
    if (!blogs.length) {
        return null
    }

    const authors = blogs.reduce((acc, blog) => {
        acc[blog.author] = (acc[blog.author] || 0) + blog.likes
        return acc;
    }, {});

    let maxAuthor = Object.keys(authors)[0]

    for (const author in authors) {
        if (authors[author] > authors[maxAuthor]) {
            maxAuthor = author
        }
    }

    return {
        author: maxAuthor,
        likes: authors[maxAuthor]
    }
}

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
    mostBlogs,
    mostLikes
}