const express = require("express");
const cors = require("cors");
const stripe = require("stripe")(
    "sk_test_51NGpO9SDZrS775GMdVB4G2QhLrT4iBuDH9qpNeHh7Ms57lzD" +
    "euneK7d5jT409iPcLo9IFs1aNFXKWVWPTDVYuhd300jnqIfIka"
);

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.status(200).send("Hello, world!");
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
