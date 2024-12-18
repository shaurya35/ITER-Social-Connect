const db = require("../firebase/firebaseConfig");
const {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} = require("firebase/firestore");

const getAllPosts = async (req, res) => {
  try {
    const postsCollection = collection(db, "posts");
    const postsSnapshot = await getDocs(postsCollection);

    const posts = postsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      posts,
    });
  } catch (error) {
    res.status(400).json({
      error: "Failed to fetch posts. Please try again later.",
    });
  }
};

const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const postRef = doc(db, "posts", id);
    const postSnapshot = await getDoc(postRef);

    if(postSnapshot.exists()){
      res.status(200).json({
        id: postSnapshot.id,
        ...postSnapshot.data(),
      })
    }else{
      res.status(404).json({
        error: "Post not found",
      })
    }


  }catch(error){
    res.status(400).json({
      error: "Failed to fetch particular post, please try again!"
    })
  }
}

module.exports = { getAllPosts, getPostById };
