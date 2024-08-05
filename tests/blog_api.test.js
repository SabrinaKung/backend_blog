const { test, beforeEach, after, describe } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcryptjs')
const helper = require('./test_helper')
const Blog = require('../models/blog')
const User = require('../models/user')
const app = require('../app')

const api = supertest(app)
describe('when there is initially some notes saved', () => {

    beforeEach(async () => {
        await Blog.deleteMany({})

        // const blogObjects = helper.initialBlogs
        //     .map(blog => new Blog(blog))
        // const promiseArray = blogObjects.map(blog => blog.save())
        // await Promise.all(promiseArray)

        for (let blog of helper.initialBlogs) {
            let blogObject = new Blog(blog)
            await blogObject.save()
        }
    })

    test('blogs are returned as json', async () => {
        await api
            .get('/api/blogs')
            .expect(200)
            .expect('Content-Type', /application\/json/)
    })

    test('all blogs are returned', async () => {
        const response = await api.get('/api/blogs')

        assert.strictEqual(response.body.length, helper.initialBlogs.length)
    })

    test('there are 6 blogs', async () => {
        const response = await api.get('/api/blogs')
        // console.log(response.body)
        assert.strictEqual(response.body.length, 6)
    })

    test('a specific blog is within the returned blogs', async () => {
        const response = await api.get('/api/blogs')
        const titles = response.body.map(e => e.title)
        assert(titles.includes('First class tests'))
    })

    test('blogs have unique identifier property named id', async () => {
        const response = await api.get('/api/blogs')
        const blogs = response.body

        blogs.forEach(blog => {
            assert(blog.id, 'Blog should have an id property')
            assert(!blog._id, 'Blog should not have an _id property')
        })
    })

    describe('viewing a specific note', () => {
        test('succeeds with a valid id', async () => {
            const blogsAtStart = await helper.blogsInDb()

            const blogToView = blogsAtStart[0]
            const resultBlog = await api
                .get(`/api/blogs/${blogToView.id}`)
                .expect(200)
                .expect('Content-Type', /application\/json/)

            assert.deepStrictEqual(resultBlog.body, blogToView)
        })

        test('fails with statuscode 404 if blog does not exist', async () => {
            const validNonexistingId = await helper.nonExistingId()

            await api
                .get(`/api/blogs/${validNonexistingId}`)
                .expect(404)
        })

        // test.only('fails with statuscode 400 id is invalid', async () => {
        //     const invalidId = '5a3d5da59070081a82a3445'

        //     await api
        //       .get(`/api/blogs/${invalidId}`)
        //       .expect(400)
        // })

        test('update the likes of a blog', async () => {
            const blogsAtStart = await helper.blogsInDb()
            const blogToUpdate = blogsAtStart[0]

            const updatedBlogData = { ...blogToUpdate, likes: blogToUpdate.likes + 1 }

            const response = await api
                .put(`/api/blogs/${blogToUpdate.id}`)
                .send(updatedBlogData)
                .expect(200)
                .expect('Content-Type', /application\/json/)

            const updatedBlog = response.body
            assert.deepStrictEqual(updatedBlog.likes, blogToUpdate.likes + 1)
        })
    })

    describe('addition of a new blog', () => {
        let token;

        beforeEach(async () => {
            await User.deleteMany({})
            const passwordHash = await bcrypt.hash('sekret', 10)
            const user = new User({ username: 'root', passwordHash })
            await user.save()

            // Assuming you have a function to get a valid token
            const loginResponse = await api
                .post('/api/login')
                .send({ username: 'root', password: 'sekret' })
                .expect(200)
                .expect('Content-Type', /application\/json/)

            token = loginResponse.body.token;
        });

        test('a valid blog can be added ', async () => {
            const newBlog = {
                title: 'async/await simplifies making async calls',
                url: 'http',
                author: 'me',
                likes: 20
            }

            await api
                .post('/api/blogs')
                .set('Authorization', `Bearer ${token}`)
                .send(newBlog)
                .expect(201)
                .expect('Content-Type', /application\/json/)

            const response = await api.get('/api/blogs')

            const titles = response.body.map(r => r.title)

            assert.strictEqual(response.body.length, helper.initialBlogs.length + 1)

            assert(titles.includes('async/await simplifies making async calls'))
        })

        test('if likes property is missing, it defaults to 0', async () => {
            const newBlog = {
                title: 'Test Blog',
                author: 'Test Author',
                url: 'http://testurl.com'
            }

            const response = await api.post('/api/blogs').set('Authorization', `Bearer ${token}`).send(newBlog)
            const createdBlog = response.body

            assert.strictEqual(createdBlog.likes, 0, 'Likes should default to 0 if missing')
        })

        test('blog without title is not added', async () => {
            const newBlog = {
                author: 'Test Author',
                url: 'http://testurl.com',
                likes: 5
            }

            await api
                .post('/api/blogs')
                .set('Authorization', `Bearer ${token}`)
                .send(newBlog)
                .expect(400)

            const blogsAtEnd = await Blog.find({})
            assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
        })

        test('blog without url is not added', async () => {
            const newBlog = {
                title: 'Test Blog',
                author: 'Test Author',
                likes: 5
            }

            await api
                .post('/api/blogs')
                .set('Authorization', `Bearer ${token}`)
                .send(newBlog)
                .expect(400)

            const blogsAtEnd = await Blog.find({})
            assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
        })
    })

    // after(async () => {
    //     await mongoose.connection.close()
    // })
})

describe('deletion of a blog', () => {
    let token;

    beforeEach(async () => {
        await User.deleteMany({})
        const passwordHash = await bcrypt.hash('sekret', 10)
        const user = new User({ username: 'root', passwordHash })
        await user.save()

        const loginResponse = await api
            .post('/api/login')
            .send({ username: 'root', password: 'sekret' })
            .expect(200)
            .expect('Content-Type', /application\/json/)

        token = loginResponse.body.token;

        await Blog.deleteMany({})
        const blog = new Blog({
            title: 'React patterns',
            author: 'Michael Chan',
            url: 'https://reactpatterns.com/',
            likes: 7,
            user: user._id
        })
        await blog.save()
    })

    test('succeeds with status code 204 if id is valid', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const blogToDelete = blogsAtStart[0]

        await api
            .delete(`/api/blogs/${blogToDelete.id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(204)

        const blogsAtEnd = await helper.blogsInDb()
        assert.strictEqual(blogsAtEnd.length, blogsAtStart.length - 1)

        const titles = blogsAtEnd.map(r => r.title)
        assert(!titles.includes(blogToDelete.title))
    })

    // after(async () => {
    //     await mongoose.connection.close()
    // })
})

describe('when there is initially one user in db', () => {
    beforeEach(async () => {
        await User.deleteMany({})

        const passwordHash = await bcrypt.hash('sekret', 10)
        const user = new User({ username: 'root', passwordHash })

        await user.save()
    })

    test.only('creation succeeds with a fresh username', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'mluukkai',
            name: 'Matti Luukkainen',
            password: 'salainen',
        }

        await api
            .post('/api/users')
            .send(newUser)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const usersAtEnd = await helper.usersInDb()
        assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)

        const usernames = usersAtEnd.map(u => u.username)
        assert(usernames.includes(newUser.username))
    })

    after(async () => {
        // await User.deleteMany({})
        await mongoose.connection.close()
    })
})