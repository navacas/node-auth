const router = require('express').Router()
const bcrypt = require('bcryptjs')
const res = require('express/lib/response')
const jwt = require('jsonwebtoken')
const User = require('../models/user')
const Client = require('../models/client')

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

//Clientes

//Crear un cliente
router.post('/client/new', async (req, res) => {
    const client = new Client({
        fullName: req.body.fullName,
        gender: req.body.gender,
        country: req.body.country,
        state: req.body.state,
    })

    await client.save()
    res.status(201).send({
        message: 'Satisfactorio'
    })
})

//Obtener todos los clientes
router.get('/clients', async (req, res) => {
    try{
        const allClients = await Client.find({});
        res.status(200).json(allClients);
    }catch (e){
        return res.status(404).send({
            message: 'Not Found'
        })
    } 
})

// Retornar un cliente en especifico
router.get('/client/:id', async (req, res) => {
    const clientId = req.params.id;
    try{
        const client = await Client.findById( clientId ).exec();
        if (!client) {
            return res.status(404).send({
                message: 'Client not found'
            })
        }
        res.status(200).json(client);
    }catch (e){
        return res.status(400).send({
            message: 'Error'
        })
    } 
})

// Borrar a un cliente
router.delete('/client/:id', async (req, res) => {
    const clientId = req.params.id;
    try{
        const client = await Client.findById( clientId ).exec();
        if (!client) {
            return res.status(404).send({
                message: 'Client not found'
            })
        }
        await Client.remove( client );
        res.status(200).send({
            message: 'Client successfull deleted'
        })
    }catch (e){
        return res.status(400).send({
            message: 'Error'
        })
    } 
})

// Actualizar un cliente
router.put('/client/:id', async (req, res) => {
    try{
        const clientId = req.params.id;
        // const { fullName, gender, country, state } = req.body;
        // const result = await schema.validateAsync({ fullName, gender, country, state });
        const client = await Client.findById( clientId );
        if (!client) {
            return res.status(404).send({
                message: 'Client not found'
            })
        }

        let newvalues = { $set: {
            fullName: req.body.fullName, 
            gender: req.body.gender, 
            country: req.body.country, 
            state: req.body.state,  
        }};
        await Client.updateOne(newvalues);
        
        res.status(200).send({
            message: 'Client successfull updated'
        })
    }catch (e){
        return res.status(400).send({
            message: 'Error'
        })
    } 
})


module.exports = router;