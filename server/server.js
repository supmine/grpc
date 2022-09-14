const PROTO_PATH="./restaurant.proto";

var mongoose = require("mongoose");
var grpc = require("grpc");
var protoLoader = require("@grpc/proto-loader");

var Menu = require('../models/menu');

require('dotenv').config()

mongoose.connect(`mongodb://localhost:${process.env.DB_PORT}/${process.env.DB_NAME}`, {
    "auth": { "authSource": "admin" },
    "user": process.env.DB_APP_USER,
    "pass": process.env.DB_APP_PASS
});

var packageDefinition = protoLoader.loadSync(PROTO_PATH,{
    keepCase: true,
    longs: String,
    enums: String,
    arrays: true
});

var restaurantProto =grpc.loadPackageDefinition(packageDefinition);

const server = new grpc.Server();


server.addService(restaurantProto.RestaurantService.service,{
    getAllMenu: async (_,callback)=>{
        try {
            let menu = await Menu.find({});
            callback(null, {menu});
        } catch (error) {
            callback({
                code: grpc.status.INTERNAL,
                details: "Internal error"
            });
        }
    },
    get: async (call,callback)=>{
        try {
            let menuItem = await Model.findById(call.request.id);
            callback(null, menuItem);
        } catch (error) {
            callback({
                code: grpc.status.NOT_FOUND,
                details: "Not found"
            });
        }
    },
    insert: async (call, callback)=>{
        let menuItem=call.request;
        const menu = new Menu(menuItem);
        try {
          await menu.save();
          callback(null, menu);
        } catch (error) {
            callback({
                code: grpc.status.INTERNAL,
                details: "Internal error"
            });
        }
    },
    update: async (call,callback)=>{
        try {
            let existingMenuItem = await Menu.findByIdAndUpdate(call.request.id, {
                name: call.request.name,
                price: call.request.price,
            });
            if (!existingMenuItem) {
                callback({
                    code: grpc.status.NOT_FOUND,
                    details: "NOT Found"
                });
            } else {
                await existingMenuItem.save();
                callback(null, existingMenuItem);
            }
        } catch (error) {
            callback({
                code: grpc.status.NOT_FOUND,
                details: "Not Found"
            });
        }
    },
    remove: async (call, callback) => {
        try {
            let menu = await Menu.findByIdAndDelete(call.request.id);
            if (!menu) {
                callback({
                    code: grpc.status.NOT_FOUND,
                    details: "NOT Found"
                });
            } else {
                callback(null,{});
            }
        } catch (error) {
            callback({
                code: grpc.status.INTERNAL,
                details: "Internal error"
            });
        }
    }
});

server.bind("127.0.0.1:30043",grpc.ServerCredentials.createInsecure());
console.log("Server running at http://localhost:30043");
server.start();