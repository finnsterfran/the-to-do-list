const express = require('express');
const mongoose = require('mongoose');
const ejs = require('ejs');
const _ = require('lodash');
const app = express();
const date = require(__dirname + '/date.js');

// middlewares
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));
mongoose.set('strictQuery', false);
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI);

const itemsSchema = mongoose.Schema({
  name: String,
});

const Item = mongoose.model('Item', itemsSchema);

const newItem1 = new Item({
  name: 'Run away',
});
const newItem2 = new Item({
  name: 'Feel sorry for myself',
});
const newItem3 = new Item({
  name: 'Drink a gallon of coffee',
});
const defaultItems = [newItem1, newItem2, newItem3];

const listSchema = mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const List = mongoose.model('List', listSchema);

app.get('/', (req, res) => {
  Item.find({}, (err, foundItems) => {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log('Successful insertion of default items');
        }
      });
      res.redirect('/');
    } else {
      res.render('list', { listTitle: 'Today', newListItems: foundItems });
    }
  });
});

app.post('/', (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName,
  });
  if (listName === 'Today') {
    item.save();
    res.redirect('/');
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect('/' + listName);
    });
  }
});

app.post('/delete', (req, res) => {
  const checkedItemID = req.body.checkedItem;
  const listName = req.body.listName;
  if (listName === 'Today') {
    Item.findByIdAndRemove(checkedItemID, (err) => {
      if (!err) {
        console.log('Deletion was successful');
        res.redirect('/');
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemID } } },
      (err, foundList) => {
        if (!err) {
          res.redirect('/' + listName);
        }
      },
    );
  }
});

app.get('/:customListName', (req, res) => {
  const listName = _.capitalize(req.params.customListName);
  List.findOne({ name: listName }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: listName,
          items: defaultItems,
        });
        list.save();
        res.redirect('/' + listName);
      } else {
        res.render('list', {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.listen(3000, () => {
  console.log('Server found Pikachu on Port 3000');
});
