import React from "react";
import Masonry from "react-masonry-css";
import Post from "./Post";

const breakpointColumnsObj = {
  default: 3,
  1100: 2,
  700: 1,
};

const MasonryGrid = ({ posts, loggedInUser, onPostClick }) => (
  <Masonry
    breakpointCols={breakpointColumnsObj}
    className="masonry-grid"
    columnClassName="masonry-grid_column"
  >
    {posts.map((post) => (
      <div
        key={post._id}
        style={{ marginBottom: "20px", cursor: "pointer" }}
        onClick={() => onPostClick(post)}
      >
        <Post post={post} loggedInUser={loggedInUser} />
      </div>
    ))}
  </Masonry>
);

export default MasonryGrid;