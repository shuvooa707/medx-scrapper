const fs = require("fs");
const cheerio = require("cheerio");
const fetch = require("node-fetch");
const mysql = require('mysql2');
const { log } = require("console");


let MIN_DELAY = 10 * 1000;
let MAX_DELAY = 20 * 1000;
let UPTO = 5000;
let buffer = 0;
let ExitAt = 10;

// const proxy = new HttpsProxyAgent.HttpsProxyAgent("http://103.146.17.241");

// Create a connection pool (recommended for better performance)
const pool = mysql.createPool({
    host: 'localhost', // Replace with your MySQL host
    user: 'shuvo', // Replace with your MySQL username
    password: 'Alpha@123', // Replace with your MySQL password
    database: 'medx', // Replace with your database name
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


async function scrapbrand(serial=1) {
    if ( buffer == ExitAt ) {
        pool.end();
        process.exit(1)
    }
    console.log("buffer: " + buffer);
    let url = `https://medex.com.bd/brands/${serial}`;
	let headers = new Headers({
		"Accept"       : "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
		"Connection"   : "keep-alive",
		"User-Agent"   : `Mozilla/5.0 (${generateString(20)}); UBUNtu Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36`
		// "User-Agent"   : `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/W.X.Y.Z Safari/537.36`
	});
	let res = null;
	try {
		res = await fetch(url, {
			headers: headers,
			// agent: proxy
		})
		.then( r => { 
			// console.log( r.headers );
			return r.text();
		})
	} catch (error) {
		console.log( error );
		fs.appendFileSync("./brand_missed", serial + ",");
        insertMissedBrand(url, serial);
        buffer++;
		setTimeout( () => {
            if( buffer <= ExitAt ) {
                scrapbrand(parseInt(serial) + 1)
            }
		}, (MIN_DELAY + Math.random() * MAX_DELAY));
		return;
	}
    
    // console.log(res);
    let $ = cheerio.load(res);
    let elem = $(".brand-header h1.page-heading-1-l span:nth-child(2)").first();
    let brand_name = $(elem)?.html()?.split("<small")[0]?.trim();
    elem = $(".brand-header h1.page-heading-1-l .h1-subtitle").first();
    let type = $(elem).text()?.trim();
    elem = $('.brand-header div[title="Generic Name"]').first();
    let generic_name = $(elem)?.text().trim();
    elem = $('.brand-header div[title="Strength"]').first();
    let strength = $(elem).text().trim();
    elem = $('.brand-header div[title="Manufactured by"]').first();
    let manufacturer_name = $(elem).text().trim();
    elem = $('.brand-header div[title="Manufactured by"] a').first();
    let manufacturer_link = $(elem).attr("href");
    elem = $('.package-container span span').first();
    let price = $(elem)?.text()?.trim();
    let indications = $('#indications')?.next()?.text().trim();
    let composition = $('#composition')?.next()?.text().trim();
    let pharmacology = $('#mode_of_action')?.next()?.text().trim();
    let dosage = $('#dosage')?.next()?.text().trim();
    let interaction = $('#interaction')?.next()?.text().trim();
    let contraindications = $('#contraindications')?.next()?.text().trim();
    let side_effects = $('#side_effects')?.next()?.text().trim();
    let pregnancy_cat = $('#pregnancy_cat')?.next()?.text().trim();
    let precautions = $('#precautions')?.next()?.text().trim();
    let overdose_effects = $('#overdose_effects')?.next()?.text().trim();
    let drug_classes = $('#drug_classes')?.next()?.text().trim();
    let storage_conditions = $('#storage_conditions')?.next()?.text().trim();
    
	if( brand_name ) {
        console.log(`serial: ${serial}`);
        console.log(`url: ${url}`);
        console.log(`brand_name: ${brand_name}`);
        console.log(`type: ${type}`);
		insertBrand(
            url,
            serial,
			brand_name, 
			generic_name, 
            type,
			strength, 
			manufacturer_name, 
			manufacturer_link, 
			price, 
			indications, 
			composition,
			pharmacology,
			dosage,
			interaction,
			contraindications,
			side_effects,
			pregnancy_cat,
			precautions,
			overdose_effects,
			drug_classes,
			storage_conditions
		);
		// fs.writeFileSync("./brand_last", serial.toString(), "utf-8");
        updateConfig(serial);
        buffer = 0;
		//console.log("last-> " + serial);
	} else {
		fs.appendFileSync("./brand_missed", serial + ",");
        insertMissedBrand(url, serial);
        buffer++;
	}
    //console.log( url  );
    // console.log( brand_name, generic_name, strength, manufacturer_name, manufacturer_link, price );
    

	setTimeout(() => {
        if( serial <= UPTO && buffer <= ExitAt ) {
            scrapbrand(parseInt(serial) + 1)
        }
	}, (MIN_DELAY + Math.random() * MAX_DELAY));
}



function insertBrand(
    url,
    serial,
    name, 
    generic_name,
    type,
    strength, 
    manufacturer_name, 
    manufacturer_link, 
    price, 
    indications, 
    composition,
    pharmacology,
    dosage,
    interaction,
    contraindications,
    side_effects,
    pregnancy_cat,
    precautions,
    overdose_effects,
    drug_classes,
    storage_conditions ) {
    pool.query(`INSERT INTO 
                    brands (
                        url,
                        serial,
                        name, 
                        generic_name,
                        type,
                        strength, 
                        manufacturer_name, 
                        manufacturer_link, 
                        price, 
                        indications, 
                        composition,
                        pharmacology,
                        dosage,
                        interaction,
                        contraindications,
                        side_effects,
                        pregnancy_cat,
                        precautions,
                        overdose_effects,
                        drug_classes,
                        storage_conditions
                    ) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                    [
                        url,
                        serial,
                        name, 
                        generic_name, 
                        type,
                        strength, 
                        manufacturer_name, 
                        manufacturer_link, 
                        price, 
                        indications, 
                        composition,
                        pharmacology,
                        dosage,
                        interaction,
                        contraindications,
                        side_effects,
                        pregnancy_cat,
                        precautions,
                        overdose_effects,
                        drug_classes,
                        storage_conditions
                    ], (err, results) => {
      if (err) {
        console.error('Error inserting data:', err.message);
      } else {
        console.log('->> Data inserted successfully!');
        console.log("------------------------------------");
      }
    });
}

function insertMissedBrand( url, serial ) {
    pool.query(`INSERT INTO 
                    brands_missed (
                        url,
                        serial
                    ) 
                    VALUES (?, ?)`, 
                    [
                        url,
                        serial
                    ], (err, results) => {
                        if (err) {
                            console.error('Error inserting data:', err.message);
                        } else {

                        }
                    }
                );
}



// helper functions

function generateString(length) {
	const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = ' ';
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

function updateConfig(last_scraped) {
    config.last_scraped = last_scraped;
    fs.writeFileSync("config.json", JSON.stringify(config), "utf-8");
}

// End helper functions


/**************** main  *****************/
// let last = fs.readFileSync("brand_last", "utf-8");
// UPTO = fs.readFileSync("brand_upto", "utf-8");
let config = fs.readFileSync("config.json", "utf-8");
config = JSON.parse(config);
let last = config.last_scraped;
UPTO = config.ends_at;
console.log(config);
scrapbrand(last);
// setInterval(() => {
//     MIN_DELAY = 5000 + Math.random() * 10000;
//     MAX_DELAY = 10000 + Math.random() * 20000;
// }, 4000);