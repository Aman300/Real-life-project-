const authorModel = require("../models/authorModel");
const blogModel = require("../models/blogModel");
const jwt = require("jsonwebtoken");



const createBlog = async function (req, res) {
  //try-statement defines a code-block to run if there is an error or undefined variable then it handle catch-statement to handle the error.
  try {
    let data = req.body;
    let author = req.body.authorId;
    //console.log(author)

    //findById is used to find the single author _id, that matches the given id, given by the frontend.
    let Id = await authorModel.findById({ _id: author });
    //console.log(Id)
    if (Id) {
      let dataCreated = await blogModel.create(data);
      res.status(201).send({ status: true, data: dataCreated });
    } else {
      res.status(400).send({ status: false, msg: "Author does not exist!" });
    }
  } catch (err) {
    res
      .status(500)
      .send({
        status: false,
        msg: "Server not responding.",
        error: err.message,
      });
  }
};

//------------------------------------------------------------------------------------------//




const getBlog = async function (req, res) {
try{

  let Category = req.query.category;
  let SubCategory = req.query.subCategory;
  let Id = req.query.authorId;
  let Tags = req.query.tags;



  if(!Category && !SubCategory && !Id && !Tags){
    let blog = await blogModel.find({ ispublished: true, isDeleted: false });
  return res.status(200).send({status:true, msg: blog });
  }

  let division = await blogModel.find({
    $or: [
      { authorId: Id },
      { category: Category },
      { subCategory: SubCategory },
      { tags: Tags },
    ],
  });

if(division.length===0){
return  res.status(404).send({msg:"Not Found"})
}

if (division.length != 0) {
  var data = division.filter(
    (x) => x.ispublished === true && x.isDeleted === false
  );
}
console.log(data)
 if(data.length===0){
    return res.status(404).send({msg:"Blog does not exist"})
    }
     else if (data) {
    return  res.status(200).send({status:true, msg: data });
     }
}
catch (err) {
  res
    .status(500)
    .send({
      status: false,
      msg: "Server not responding",
      error: err.message,
    });
}
};



//-----------------------------------------------------------------------------------------//

const updateBlog = async function (req, res) {
  try {
    let token = req.headers["x-Api-key"] || req.headers["x-api-key"];
    let decodedtoken = jwt.verify(token, "project1-uranium");
    let authorLoggedIn = decodedtoken.authorId;

    let blogId = req.params.blogId;
    let Body = req.body;
    const { title, body, tags, subCategory } = Body;
    let blog = await blogModel
      .findOne({ _id: blogId })
      .select({ _id: 0, authorId: 1 });

    if (blog == null) {
      res.status(404).send({ status: false, msg: "Blog does not exist." }); //blog Id does not exist becouse id is not from blog collection. Here we are checking blog id from path param.
    } else if (authorLoggedIn == blog.authorId) {
      console.log(blog.authorId);
      console.log(authorLoggedIn);

      const updateBlogs = await blogModel
        .findOneAndUpdate(
          { _id: blogId },
          {
            title: title,
            body: body,
            $addToSet: { tags: tags, subCategory: subCategory },
            ispublished: true,
          },
          { new: true }
        )
        .populate("authorId");
      res.status(200).send({ status: true, date: updateBlogs });
    } else {
      res.status(401).send({ status: false, msg: "Not authorised" });
    }
  } catch (err) {
    res
      .status(500)
      .send({
        status: false,
        msg: "Server not responding",
        error: err.message,
      });
  }
};

//------------------------------------------------------------------------------------------//

const deleteBlog = async function (req, res) {
  try {
    let token = req.headers["x-Api-key"] || req.headers["x-api-key"];
    let decodedtoken = jwt.verify(token, "project1-uranium");
    let authorLoggedIn = decodedtoken.authorId;

    let blogId = req.params.blogId;
    let blog = await blogModel
      .findOne({ _id: blogId, isDeleted: false })
      .select({ _id: 0, authorId: 1 });

    if (blog == null) {
      res.status(404).send({ status: false, msg: "Blog does not exist." }); //blog Id does not exist becouse id is not from blog collection. Here we are checking blog id from path param.
    } else if (authorLoggedIn == blog.authorId) {
      console.log(blog.authorId);
      console.log(authorLoggedIn);
      const deleteBlogs = await blogModel
        .findOneAndUpdate(
          { _id: req.params.blogId },
          { isDeleted: true },
          { new: true }
        )
        .populate("authorId");
      res.status(200).send({ status: true, msg: deleteBlogs });
    } else {
      res.status(401).send({ status: false, msg: "Not authorised" });
    }
  } catch (err) {
    res
      .status(500)
      .send({
        status: false,
        msg: "Server not responding",
        error: err.message,
      });
  }
};

//------------------------------------------------------------------------------------------//



const deleteBlog1 = async function (req, res) {
  let token = req.headers["x-Api-key"] || req.headers["x-api-key"];
  let decodedtoken = jwt.verify(token, "project1-uranium");
  let authorLoggedIn = decodedtoken.authorId;

  let Category = req.query.category;
  let SubCategory = req.query.subCategory;
  let Id = req.query.authorId;
  let Tags = req.query.tags;

  let division = await blogModel.find({
          $or: [
            { authorId: Id },
            { category: Category },
            { subCategory: SubCategory },
            { tags: Tags },
          ],
          isDeleted: false,
        })
//console.log("This is division",division)

  if(division.length==0){
    res.status(404).send({ status: false, message: "Blog does not exist!" });
  }else{
    let NotAuth = []
    let Deleted = []

        for(i=0;i<division.length;i++){

          if(authorLoggedIn!=division[i].authorId){
            
            //console.log(authorLoggedIn,"loggedin")
            //console.log(division[i].authorId)

            NotAuth.push(division[i])
          
          }else{
            var deleteBlogs = await blogModel.updateOne(
                            { _id: division[i]._id },
                            { $set: { isDeleted: true } },
                            { new: true,upsert : true }
                          );
                          Deleted.push(deleteBlogs)        
          }
        }
        //console.log(Deleted)
        //console.log(NotAuth)
       if(Deleted.length==0){
              res.status(401).send({ status: false, message: "Not authorised!" });
       }else{
          return res.status(200).send({ status: true, msg: Deleted });
       }
   }

}



//------------------------------------------------------------------------------------------//

module.exports.createBlog = createBlog;
module.exports.getBlog = getBlog;
module.exports.updateBlog = updateBlog;
module.exports.deleteBlog = deleteBlog;
module.exports.deleteBlog1 = deleteBlog1;












// const getBlog = async function (req, res) {
//   try {
//     let Category = req.query.category;
//     let SubCategory = req.query.subCategory;
//     let Id = req.query.authorId;
//     let Tags = req.query.tags;

//     let division = await blogModel.find({
//       $or: [
//         { authorId: Id },
//         { category: Category },
//         { subCategory: SubCategory },
//         { tags: Tags },
//       ],
//     });

//     if (division.length != 0) {
//       let data = division.filter(
//         (x) => x.ispublished === true && x.isDeleted === false
//       );

//       if (data) {
//         res.status(200).send({ status: true, msg: data });
//       } else {
//         res.status(404).send({ status: false, msg: "Blog does not exist!" });
//       }
//     } else {
//       let blog = await blogModel
//         .find({ ispublished: true, isDeleted: false })
//         .populate(authorId);
//       // console.log(blog)
//       res.status(200).send({ status: true, msg: blog });
//     }
//   } catch (err) {
//     res
//       .status(500)
//       .send({
//         status: false,
//         msg: "Server not responding",
//         error: err.message,
//       });
//   }
// };