const router = require('express').Router()
const bcrypt = require('bcryptjs')
const res = require('express/lib/response')
const jwt = require('jsonwebtoken')
const User = require('../models/user')

router.post('/register', async (req, res) => {
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(req.body.password, salt)

    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
    })

    const result = await user.save()

    const {password, ...data} = await result.toJSON()
    
    res.send(data)
})

router.post('/login', async (req, res) => {
    const user = await User.findOne({email: req.body.email})

    if(!user){
        return res.status(404).send({
            message: 'Usuario no encontrado'
        })
    }

    if(!await bcrypt.compare(req.body.password, user.password)){
        return res.status(400).send({
            message: 'Credenciales invalidas'
        })
    }

    const token = jwt.sign({id: user.id}, "secret")

    //Guardar el token en una cookie
    res.cookie('jwt', token, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000  // 1 día
    })

    res.send({
        message: 'Satisfactorio'
    })
})

// Autenticación de usuarios
router.get('/user', async (req, res) => {
    try{
        const cookie = req.cookies['jwt']

        const claims = jwt.verify(cookie, 'secret')

        if(!claims){
            return res.status(401).send({
                message: 'Unauthenticated'
            })
        }

        const user = await User.findOne({id: claims.id})
        const {password, ...data} = await user.toJSON() //Retornar sin la contraseña
        res.send(data)
    }catch (e){
        return res.status(401).send({
            message: 'Unauthenticated'
        })
    }
        
    
})

//Cierre de sesión
//Remover cookie
router.post('/logout', async(req, res) => {
    res.cookie('jwt', '', {maxAge: 0})

    res.send({
        message: 'Ha cerrado sesión'
    })
})

module.exports = router;