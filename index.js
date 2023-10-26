// Importa el módulo 'express' para crear una aplicación web
const express = require('express');
const Joi = require('joi');
const path = require('path');

const PDFDocument = require('pdfkit');
// Importa el módulo 'fs' (File System) para trabajar con archivos
const fs = require('fs');

// Importa la función 'uuidv4' del módulo 'uuid' para generar identificadores únicos
const { v4: uuidv4 } = require('uuid');

// Importa los módulos creados internamente, en este caso, el módulo 'files' en la carpeta 'src'
const { readFile, writeFile } = require('./src/files.js');

// Ruta del archivo donde se almacenarán los datos de los países
const FILE_NAME = './DB/Country.txt';

// Crea una instancia de la aplicación Express
const app = express();

// Configura Express para analizar datos de formularios y JSON en las solicitudes
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Configura el motor de vistas y la carpeta de vistas
app.set('views', path.join(__dirname, 'src/views'));
app.set('view engine', 'ejs');



// Define un esquema de validación utilizando Joi
const countrySchema = Joi.object({
    Nombre: Joi.string().required(),
    Capital: Joi.string().required(),
    Edad: Joi.number().integer().required(),
    EsIndependiente: Joi.boolean().required(),
    ComidasTipicas: Joi.array().items(Joi.object({
        Nombre: Joi.string()
    })),
    Poblacion: Joi.number().required(),
    Presidente: Joi.string().required(),
    Continente: Joi.string().required()
});

// Define rutas de la API y Express...

// Obtener todos los países
app.get('/Country', (req, res) => {
    // Lee los datos del archivo especificado en FILE_NAME
    const data = readFile(FILE_NAME);

    // Envía una respuesta JSON al cliente con los datos leídos del archivo
    res.json(data);
});

// Crear un nuevo país
app.post('/Country', (req, res) => {
    try {
        // Obtener el nuevo país desde la solicitud POST
        const newCountry = req.body;

        // Validar los datos con el esquema definido
        const { error } = countrySchema.validate(newCountry);

        if (error) {
            // Generar un nuevo ID único para el país utilizando 'uuid'
            newCountry.id = uuidv4();

            // Leer los datos actuales de los países desde el archivo
            const data = readFile(FILE_NAME);

            // Agregar el nuevo país al conjunto de datos existente
            data.push(newCountry);

            // Escribir los datos actualizados en el archivo
            writeFile(FILE_NAME, data);

            // Responder con un mensaje de éxito
            res.json({ message: 'El país fue creado exitosamente' });
        } else {
            // Los datos no cumplen con los requisitos, muestra un mensaje de error
            console.error('Los datos de la solicitud POST no cumplen con los requisitos especificados.');
            res.status(400).json({ message: 'Los datos de la solicitud POST no cumplen con los requisitos especificados.' });
        }
    } catch (error) {
        // Manejar errores, como problemas de lectura/escritura en el archivo
        console.error(error);
        res.json({ message: 'Error al almacenar país' });
    }
});

// Obtener un solo país por su ID
app.get('/Country/:id', (req, res) => {
    // Guardar el ID proporcionado en la URL
    const id = req.params.id;

    // Leer el contenido del archivo que contiene los países
    const countries = readFile(FILE_NAME);

    // Buscar el país con el ID proporcionado
    const countryFound = countries.find(country => country.id === id);

    // Comprobar si el país fue encontrado
    if (!countryFound) {
        res.status(404).json({ 'ok': false, message: 'Country not found' });
    }

    // Responder con los datos del país encontrado
    res.json({ 'ok': true, country: countryFound });
});

// Ruta para actualizar un país por su ID
app.put('/Country/:id', (req, res) => {
    // Obtener el ID proporcionado en la URL
    const id = req.params.id;

    // Leer el contenido del archivo que contiene los países
    const countries = readFile(FILE_NAME);

    // Buscar el país con el ID proporcionado
    const countryIndex = countries.findIndex(country => country.id === id);

    // Comprobar si el país fue encontrado
    if (countryIndex < 0) {
        res.status(404).json({ 'ok': false, message: 'Country not found' });
        return;
    }

    // Obtener el país actual
    let country = countries[countryIndex];

    // Actualizar los datos del país con los datos proporcionados en la solicitud
    country = { ...country, ...req.body };

    // Reemplazar el país en la lista con el país actualizado
    countries[countryIndex] = country;

    // Escribir los datos actualizados en el archivo
    writeFile(FILE_NAME, countries);

    // Responder con los datos del país actualizado
    res.json({ 'ok': true, country: country });
});

app.delete('/Country/:id', (req, res) => {
    // Obtener el ID proporcionado en la URL
    const id = req.params.id;

    // Leer el contenido del archivo que contiene los países
    const countries = readFile(FILE_NAME);

    // Buscar el país con el ID proporcionado
    const countryIndex = countries.findIndex(country => country.id === id);

    // Comprobar si el país fue encontrado
    if (countryIndex < 0) {
        res.status(404).json({ 'ok': false, message: 'Country not found' });
        return;
    }

    // Eliminar el país del conjunto de datos
    countries.splice(countryIndex, 1);

    // Escribir los datos actualizados en el archivo
    writeFile(FILE_NAME, countries);

    // Responder con un mensaje de éxito
    res.json({ 'ok': true });

});


app.get('/CountryFilter', (req, res) => {
   
    const data = readFile(FILE_NAME);

    
    const { filterKey, filterValue } = req.query;

    if (filterKey && filterValue) {
      
        const filteredData = data.filter(country => country[filterKey] === filterValue);

        if (filteredData.length === 0) {
           
            res.status(404).json({ message: 'No se encontraron registros que coincidan con el filtro.' });
        } else {
       
            res.json(filteredData);
        }
    } else {
        
        res.json(data);
    }
});


app.get('/countries', (req, res) => {
    const countries = readFile(FILE_NAME);
    res.render('country/index', { countries: countries });
});

app.post('/countries', (req, res) => {
    try {
        const data = readFile(FILE_NAME);
        const newCountry = req.body;
        newCountry.id = uuidv4();
        data.push(newCountry);
        writeFile(FILE_NAME, data);
        res.redirect('/countries');
    } catch (error) {
        console.error(error);
        res.json({ message: 'Error al almacenar país' });
    }
});


app.get('/countries/create', (req, res) => {
  
    res.render('country/create');
});

app.post('/countries/delete/:id', (req, res) => {
    const id = req.params.id;
    const countries = readFile(FILE_NAME);
    const countryIndex = countries.findIndex(country => country.id === id);

    if (countryIndex < 0) {
        res.status(404).json({ ok: false, message: "Country not found" });
        return;
    }

    countries.splice(countryIndex, 1);
    writeFile(FILE_NAME, countries);
    res.redirect('/countries');
});

app.get('/countriess', (req, res) => {
    const countries = readFile(FILE_NAME);
    const filterKey = req.query.filterKey;
    const filterValue = req.query.filterValue;

    if (filterKey && filterValue) {
       
        const filteredCountries = countries.filter(country => country[filterKey] === filterValue);
        res.render('country/index', { countries: filteredCountries });
    } else {
       
        res.render('country/index', { countries });
    }
});


app.use((req, res, next) => {
    const accessLogPath = path.join(__dirname, 'access_log.txt');

    
    const now = new Date();
    const formattedDate = now.toISOString().replace('T', ' ').split('.')[0];

    const requestInfo = `${formattedDate} [${req.method}] [${req.path}]`;

    
    fs.appendFile(accessLogPath, requestInfo + '\n', (err) => {
        if (err) {
            console.error('Error al escribir en el archivo access_log.txt:', err);
        }
    });

    next(); 
});

function getCountryByID(id) {
  
    const countries = readFile(FILE_NAME); 
 
    const country = countries.find(country => country.id === id);

    return country; 
}


app.get('/generate-pdf/:id', (req, res) => {
    const id = req.params.id;
  
 
    const country = getCountryByID(id);
  
    if (!country) {
      res.status(404).json({ message: 'Country not found' });
      return;
    }
  
    const pdfDoc = new PDFDocument();
    const pdfFilePath = `./PDFs/${country.Nombre}.pdf`;
  
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${country.Nombre}.pdf"`);
  
    pdfDoc.pipe(fs.createWriteStream(pdfFilePath)); 
  
  
    pdfDoc
      .fontSize(18)
      .text('Detalles del País', { align: 'center' })
      .fontSize(12)
      .text(`Nombre: ${country.Nombre}`)
      .text(`Capital: ${country.Capital}`)
      .text(`Edad: ${country.Edad}`)
      .text(`Es Independiente: ${country.EsIndependiente ? 'Sí' : 'No'}`)
      .text('Comidas Típicas:')
      .list(country.ComidasTipicas.map(comida => `- ${comida.Nombre}`))
      .text(`Población: ${country.Poblacion}`)
      .text(`Presidente: ${country.Presidente}`)
      .text(`Continente: ${country.Continente}`);
  
    pdfDoc.end();
  });
  

 
// Ruta para mostrar el formulario de actualización de un país
app.get('/Country/update/:id', (req, res) => {
    const id = req.params.id;
    const countries = readFile(FILE_NAME);
    const country = countries.find(country => country.id === id);

    if (!country) {
        res.status(404).json({ message: 'Country not found' });
    } else {
        res.render('country/update', { country });
    }
});

// Ruta para procesar la actualización de un país
app.post('/Country/update/:id', (req, res) => {
    const id = req.params.id;
    const countries = readFile(FILE_NAME);
    const countryIndex = countries.findIndex(country => country.id === id);

    if (countryIndex < 0) {
        res.status(404).json({ message: 'Country not found' });
    } else {
        const updatedCountry = req.body;
        countries[countryIndex] = { ...countries[countryIndex], ...updatedCountry };
        writeFile(FILE_NAME, countries);
        res.redirect('/countries'); // Redirige a la lista de países o la página que desees
    }
});




// Iniciar el servidor y escuchar en el puerto 3000
app.listen(3000, () => {
    console.log(`Server is running on http://localhost:3000`);
});
