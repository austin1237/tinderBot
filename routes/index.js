
/*
 * GET home page.
 */

exports.index = function(req, res){
  console.log('index hit');
  res.render('index');
};

exports.partials = function (req, res) {
  console.log('partials hit');
  var name = req.params.name;
  res.render('partials/' + name);
};