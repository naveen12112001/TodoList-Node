// Modules Requiring
const express = require('express');
const mongoose = require('mongoose')
const bodyParser = require('body-parser');
const _ = require('lodash');
// const date = require(__dirname + "/date.js");   For custom today date
// Methods
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true         //Using body parser
}));
app.use(express.static("public"));
// App gets and posts
//Connection to database
// mongoose.connect("mongodb+srv://admin-naveen:Welcome@22@cluster0.uzizo.mongodb.net/todoListDB?retryWrites=true&w=majority", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   useFindAndModify:false
// });
mongoose.connect("mongodb://localhost:27017/todoListDB",{
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify:false
});
//Creating schema for the items and adding them throught the defaultItems
const itemsSchema = {
  name: String
};
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todoList!"
});
const item2 = new Item({
  name: "Hit the + button to add new items"
});
const item3 = new Item({
  name: "Hit <-- to delete an item"
});

const defaultItems = [item1, item2, item3];
const listSchema = new mongoose.Schema({ name: String, items: [itemsSchema] });
const List = mongoose.model("List",listSchema);

//-------------------Normal get route----------------
app.get("/", function(req, res) {
  let day = "Today";    // Function for date -> date.getDate();
  Item.find({}, function(err, foundItems) {
    if(foundItems.length===0)
    {
      Item.insertMany(defaultItems,function(err){
        if(err){
          console.log(err);
        }
        else{
          console.log("Success");
        }

      });
      res.redirect("/")
    }
    else{
      res.render("list",{ listTitle: "Today",newListItems: foundItems});
    }
});
});
//--------------Custom list get route----------------
app.get("/:customListName",function(req,res){
  const customListName=_.capitalize(req.params.customListName);
  List.findOne({name:customListName},function(err,foundList){
    if(err){
      console.log(err);
    }
    else{
      if(!foundList){
        //Create a new list
        const list = new List({
          name:customListName,
          items:defaultItems
        });
        list.save();
        res.redirect("/"+customListName);
      }
      else{
        //Show the existing list!
        res.render("list",{listTitle:foundList.name,newListItems:foundList.items});
      }
    }
  });

});

//Normal post route
app.post("/", function(req, res) {
  const itemName = req.body.itemName;
  const listName= req.body.list;
  const item = new Item({
    name: itemName
  });
  if(listName==="Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name:listName},function(err,foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    });
  }
});

//-----------------Delete post route-----------------
app.post("/delete",function(req,res){
  const checkBoxId= req.body.checkbox;
  const listName=req.body.listName;
  if(listName==="Today"){
    Item.findByIdAndRemove(checkBoxId,function(err){
      if(!err){
        console.log("Successfully deleted");
          res.redirect("/");
      }
    });
  }else{
    List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkBoxId}}},function(err,foundList){
      if(err){
        console.log(err);

      }
      else{
        res.redirect("/"+ listName);
      }
    });
  }
});

// Port listen
const PORT = process.env.PORT || 8080;
app.listen(PORT, function() {
  console.log("Server is up and running at port 8080");
});
