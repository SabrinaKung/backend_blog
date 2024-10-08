const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')
const userExtractor = require('../utils/middleware').userExtractor

blogsRouter.get('/', async (request, response) => {
    const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
    response.json(blogs)
    // Blog
    //     .find({})
    //     .then(blogs => {
    //         response.json(blogs)
    //     })
})

blogsRouter.post('/', userExtractor, async (request, response, next) => {
    try {
        const user = request.user

        const body = request.body

        if (!body.title || !body.url) {
            return response.status(400).json({ error: 'title or url missing' })
        }
        const blog = new Blog({
            title: body.title,
            author: body.author,
            url: body.url,
            likes: body.likes || 0, // Default to 0 if likes is not provided
            user: user.id
        })
        const savedBlog = await blog.save()
        user.blogs = user.blogs.concat(savedBlog._id)
        await user.save()
        const populatedBlog = await Blog.findById(savedBlog._id).populate('user', { username: 1, name: 1 })
        response.status(201).json(populatedBlog)
    } catch (error) {
        next(error)
    }
})

blogsRouter.put('/:id', async (request, response) => {
    const body = request.body

    const blog = {
        ...body,
        likes: body.likes,
        user: body.user.id
    }

    const updatedBlog = await Blog
        .findByIdAndUpdate(request.params.id, blog, { new: true })
        .populate('user', { username: 1, name: 1 })
    console.log('updatedBlog.toJSON()', updatedBlog.toJSON())
    response.json(updatedBlog.toJSON())
})

blogsRouter.get('/:id', async (request, response) => {
    const blog = await Blog.findById(request.params.id)
    if (blog) {
        response.json(blog)
    } else {
        response.status(404).end()
    }
})

blogsRouter.delete('/:id', userExtractor, async (request, response, next) => {
    try {
        const user = request.user

        const blog = await Blog.findById(request.params.id)
        if (!blog) {
            return response.status(404).json({ error: 'blog not found' })
        }
        if (blog.user.toString() !== user.id.toString()) {
            return response.status(403).json({ error: 'only the creator can delete this blog' })
        }

        await Blog.findByIdAndDelete(request.params.id)
        /* I'm unsure why with or without the following two lines work */
        user.blogs = user.blogs.filter(b => b._id.toString() !== blog._id.toString())
        await user.save()

        response.status(204).end()
    } catch (error) {
        next(error)
    }
})

blogsRouter.post('/:id/comments', async (request, response) => {
    const blog = await Blog
        .findById(request.params.id)
        .populate('user', { username: 1, name: 1 })
    blog.comments = blog.comments.concat(request.body.comment)
    await blog.save()
    response.json(blog)
})

module.exports = blogsRouter