export const metadata = {
  title: "Profile | ITER Connect",
  description: "View and manage your ITER Connect profile. Connect with fellow students, showcase your projects, and build your professional network.",
  openGraph: {
    title: "Profile | ITER Connect",
    description: "View and manage your ITER Connect profile. Connect with fellow students, showcase your projects, and build your professional network.",
    type: "profile",
    siteName: "ITER Connect",
  },
  twitter: {
    card: "summary",
    title: "Profile | ITER Connect",
    description: "View and manage your ITER Connect profile. Connect with fellow students, showcase your projects, and build your professional network.",
  }
};
  
  const PostsLayout = (props) => {
    return <div>{props.children}</div>;
  };
  
  export default PostsLayout;
  