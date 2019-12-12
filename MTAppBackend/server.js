/*eslint no-console: 0, no-unused-vars: 0*/
"use strict";

var xsenv = require("@sap/xsenv");
var xssec = require("@sap/xssec");
var hdbext = require("@sap/hdbext");
var express = require("express");
var passport = require("passport");
var stringifyObj = require("stringify-object");
var bodyParser = require("body-parser");

var app = express();

function mtMiddleware(req, res, next) {
	
	// Assumes the HDI container was tagged with a tag of the form subdomain:<subdomain> and is bound to the MTAppBackend
	var tagStr = "subdomain:" + req.authInfo.subdomain;
	
	// reqStr += "\nSearching for a bound hana container with tag: " + tagStr + "\n";
	
	try {
		
		try {

			var services = xsenv.getServices({
				hana: { tag: tagStr }
			});
	
		} catch (error) {
			
			var services = xsenv.getServices({
				hanatrial: { tag: tagStr }
			});

		}

		req.tenantContainer = services.hana;
		
	} catch (error) {
		
	}
	// If a container service binding was found
	// Else throw an error?  Not handled yet
	//.catch(function (error) {
	//	res.status(500).send(error.message);
	//})
	
	next();
}


passport.use("JWT", new xssec.JWTStrategy(xsenv.getServices({
	uaa: {
		tag: "xsuaa"
	}
}).uaa));
app.use(passport.initialize());
app.use(passport.authenticate("JWT", {
	session: false
}));
app.use(bodyParser.json());

app.use(mtMiddleware);

// app functionality
app.get("/", function (req, res) {
	//var reqStr = stringifyObj(req, {
	var reqStr = stringifyObj(req.authInfo.userInfo, {
    indent: "   ",
    singleQuotes: false
});

	reqStr += "\n\n";

	reqStr += stringifyObj(req.authInfo.scopes, {
    indent: "   ",
    singleQuotes: false
});

	var responseStr = "";
	responseStr += "<!DOCTYPE HTML><html><head><title>MTApp</title></head><body><h1>MTApp</h1><h2>Welcome " + req.authInfo.userInfo.givenName + " " + req.authInfo.userInfo.familyName + "!</h2><p><b>Subdomain:</b> " + req.authInfo.subdomain + "</p><br />";
	responseStr += "<a href=\"/get_legal_entity\">/get_legal_entity</a><br />";
	var isAuthorized = req.authInfo.checkScope(req.authInfo.xsappname + '.create');
	if (isAuthorized) {
		responseStr += "<a href=\"/backend/add_legal_entity\">/add_legal_entity</a><br />";
	}
	responseStr += "<p><b>Identity Zone:</b> " + req.authInfo.identityZone + "</p><p><b>Origin:</b> " + req.authInfo.origin + "</p>" + "<br /><br /><pre>" + reqStr + "</pre>" + "</body></html>";
	res.status(200).send(responseStr);
});

app.get("/get_legal_entity", function (req, res) {
	var reqStr = stringifyObj(req.authInfo.userInfo, {
		indent: "   ",
		singleQuotes: false
	});

	reqStr += "\n\n";

	
	reqStr += stringifyObj(req.authInfo.scopes, {
		indent: "   ",
		singleQuotes: false
	});
	
	//SELECT * FROM "LEGAL_ENTITY"
	
	//connect
	var conn = hdbext.createConnection(req.tenantContainer, (err, client) => {
		if (err) {
			reqStr += "ERROR: ${err.toString()}";
			var responseStr = "<!DOCTYPE HTML><html><head><title>MTApp</title></head><body><h1>MTApp Legal Entities</h1><h2>Legal Entities</h2><p><pre>" + reqStr + "</pre>" + "<br /> <a href=\"/\">Back</a><br /></body></html>";
			return res.status(200).send(responseStr);
		} else {
			client.exec('SELECT * FROM "LEGAL_ENTITY"', (err, result) => {
				if (err) {
					reqStr += "ERROR: ${err.toString()}";
					var responseStr = "<!DOCTYPE HTML><html><head><title>MTApp</title></head><body><h1>MTApp Legal Entities</h1><h2>Legal Entities</h2><p><pre>" + reqStr + "</pre>" + "<br /> <a href=\"/\">Back</a><br /></body></html>";
					return res.status(200).send(responseStr);
				} else {
					reqStr += "RESULTSET: \n\n" + stringifyObj(result, {indent: "   ",singleQuotes: false}) +  "\n\n";
					var responseStr = "<!DOCTYPE HTML><html><head><title>MTApp</title></head><body><h1>MTApp Legal Entities</h1><h2>Legal Entities</h2><p><pre>" + reqStr + "</pre>" + "<br /> <a href=\"/\">Back</a><br /></body></html>";
					return res.status(200).send(responseStr);
				}
			});
		}
	});
});

app.get("/ping", function (req, res) {

	var responseStr = "";
	responseStr += "<!DOCTYPE HTML><html><head><title>MTApp</title></head><body><h1>MTApp</h1><h2>Hello " + req.authInfo.userInfo.givenName + " " + req.authInfo.userInfo.familyName + " i'm there for you!</h2><p><b>Subdomain:</b> " + req.authInfo.subdomain + "</p><br />";
	responseStr += "<p><b>Identity Zone:</b> " + req.authInfo.identityZone + "</p><p><b>Origin:</b> " + req.authInfo.origin + "</p>" + "<br /><br /><pre>" + "Hello, I'm there!!!" + "</pre>" + "</body></html>";
	res.status(200).send(responseStr);
	
});

app.get("/getUser", function (req, res) {

	var data = {
		"givenName": req.authInfo.userInfo.givenName,
		"familyName": req.authInfo.userInfo.familyName,
		"subdomain": req.authInfo.subdomain,
		"identityZone": req.authInfo.identityZone,
		"origin": req.authInfo.origin
	}
	
	res.status(200).send(JSON.stringify(data));
	
});


app.get("/add_legal_entity", function (req, res) {
	var reqStr = stringifyObj(req.authInfo.userInfo, {
		indent: "   ",
		singleQuotes: false
	});

	reqStr += "\n\n";

	
	reqStr += stringifyObj(req.authInfo.scopes, {
		indent: "   ",
		singleQuotes: false
	});
	
	//INSERT INTO "LEGAL_ENTITY" VALUES("legalentityId".NEXTVAL, 'Added Entity',1 )"
	
	var isAuthorized = req.authInfo.checkScope(req.authInfo.xsappname + '.create');
	if (isAuthorized) {
		//connect
		var conn = hdbext.createConnection(req.tenantContainer, (err, client) => {
			if (err) {
				reqStr += "ERROR: ${err.toString()}";
				var responseStr = "<!DOCTYPE HTML><html><head><title>MTApp</title></head><body><h1>MTApp Legal Entities</h1><h2>Legal Entities</h2><p><pre>" + reqStr + "</pre>" + "<br /> <a href=\"/\">Back</a><br /></body></html>";
				return res.status(200).send(responseStr);
			} else {
				client.exec('INSERT INTO "LEGAL_ENTITY" VALUES("legalentityId".NEXTVAL, \'Added Entity\',1 )', (err, result) => {
					if (err) {
						reqStr += "ERROR: ${err.toString()}";
						var responseStr = "<!DOCTYPE HTML><html><head><title>MTApp</title></head><body><h1>MTApp Legal Entities</h1><h2>Legal Entities</h2><p><pre>" + reqStr + "</pre>" + "<br /> <a href=\"/\">Back</a><br /></body></html>";
						return res.status(200).send(responseStr);
					} else {
						reqStr += "RESULTSET: \n\n" + stringifyObj(result, {indent: "   ",singleQuotes: false}) +  "\n\n";
						var responseStr = "<!DOCTYPE HTML><html><head><title>MTApp</title></head><body><h1>MTApp Legal Entities</h1><h2>Legal Entities</h2><p><pre>" + reqStr + "</pre>" + "<br /> <a href=\"/\">Back</a><br /></body></html>";
						return res.status(200).send(responseStr);
					}
				});
			}
		});
	}
	else {
		return res.status(401).send("Unauthorized: Your user must have the " + req.authInfo.xsappname + ".create scope to perfrom this function.");
	}
});


// subscribe/onboard a subscriber tenant
app.put("/callback/v1.0/tenants/*", function (req, res) {
	var tenantAppURL = "https:\/\/" + req.body.subscribedSubdomain + "-dev-mtapprouter.cfapps.eu10.hana.ondemand.com";
	res.status(200).send(tenantAppURL);
});

// unsubscribe/offboard a subscriber tenant
app.delete("/callback/v1.0/tenants/*", function (req, res) {
	res.status(200).send("");
});

// dependency
app.get("/callback/v1.0/dependencies", function (req, res) {

	xsappnames = [];

	xsappnames.push({"xsappname": "1ba797f1-b963-4a85-9d98-b988a3e82a80-clone!b30311|lps-registry-broker!b14" });
	xsappnames.push({"xsappname": "MTApp!t30311"});
	xsappnames.push({"xsappname": "b057f1d1-e143-48a4-afaa-cb44925d598b!b30311|html5-apps-repo-uaa!b1685"});
	xsappnames.push({"xsappname": "52d23be4-95a7-4a4f-9324-f934faa677b0!b30311|html5-apps-repo-uaa!b1685"});
	xsappnames.push({"xsappname": "c5a1a120-d42e-4af0-8ab7-61534271fb6e!b30311|portal-cf-service!b3664"});
	
	res.status(200).send(JSON.stringify(xsappnames));
});

var server = require("http").createServer();
var port = process.env.PORT || 3000;

server.on("request", app);

server.listen(port, function () {
	console.info("Backend: " + server.address().port);
});