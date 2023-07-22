const express = require("express");
const cors = require("cors");
const stripe = require("stripe")(
    "sk_test_51NGpO9SDZrS775GMdVB4G2QhLrT4iBuDH9qpNeHh7Ms57lzD" +
    "euneK7d5jT409iPcLo9IFs1aNFXKWVWPTDVYuhd300jnqIfIka"
);

const app = express();
const fs = require("fs");

app.use(cors());
app.use(express.json());
const citiesData = JSON.parse(fs.readFileSync("cities_data.json", "utf-8"));

app.get("/", (req, res) => {
    res.status(200).send("Hello, world!");
});

// Function to build a graph from citiesData
function buildGraph() {
    const graph = {};
    for (const data of citiesData) {
        const origin = data["Origin City"];
        const destination = data["Destination City"];
        const prediction = data["Average Prediction"];

        if (!graph[origin]) {
            graph[origin] = [];
        }

        graph[origin].push({ city: destination, prediction });
    }
    return graph;
}
// Helper function to find indirect paths recursively
function findIndirectPath(graph, currentCity, targetCity) {
    if (!graph[currentCity]) {
        return null;
    }

    for (const { city, prediction } of graph[currentCity]) {
        if (city === targetCity) {
            return prediction;
        } else {
            const days = findIndirectPath(graph, city, targetCity);
            if (days !== null) {
                return days + prediction;
            }
        }
    }

    return null;
}

app.get("/estimatedDeliveryTime", (req, res) => {
    const sellerLocation = req.query.sellerLocation;
    const buyerLocation = req.query.buyerLocation;
    console.log(buyerLocation);
    console.log(sellerLocation);
    const graph = buildGraph();
    const directConnection = citiesData.find((data) => {
        const origin = data["Origin City"];
        const destinationCity = data["Destination City"];
        return destinationCity === buyerLocation && sellerLocation === origin;
    });

    if (directConnection) {
        const estimatedDeliveryTime = `${directConnection["Average Prediction"]} days`;
        res.status(200).json({ estimatedDeliveryTime });
    } else {
        const indirectDays = findIndirectPath(graph, sellerLocation, buyerLocation);
        if (indirectDays !== null) {
            const estimatedDeliveryTime = `${indirectDays} days`;
            res.status(200).json({ estimatedDeliveryTime });
        } else {
            console.log("Delivery route not found");
            res.status(404).json({ error: "Delivery route not found" });
        }
    }
});




app.post("/payments/create", async (req, res) => {
    const total = req.query.total;

    console.log("Payment Request Received BOOM!!! for this amount >>> ", total);

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
        amount: total, // subunits of the currency
        currency: "inr",
        description: "Software development services"
    });

    // OK - Created
    res.status(201).send({
        clientSecret: paymentIntent.client_secret
    });
});



app.listen(5001, () => {
    console.log("Server is running on http://localhost:5001");
});
