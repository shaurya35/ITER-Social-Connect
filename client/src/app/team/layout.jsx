export const metadata = {
  title: "About Our Team | ITER Connect",
  description: "Meet the passionate team behind ITER Connect. Learn about our mission to help students collaborate, innovate, and grow together in the tech community.",
  keywords: "ITER Connect team, student developers, collaboration platform, tech community, student networking",
  openGraph: {
    title: "About Our Team | ITER Connect",
    description: "Meet the passionate team behind ITER Connect. Learn about our mission to help students collaborate, innovate, and grow together in the tech community.",
    type: "website",
    siteName: "ITER Connect",
    images: [
      {
        url: 'https://itersocialconnect.vercel.app/banner.png',
        width: 1200,
        height: 630,
        alt: 'ITER Connect Team',
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Our Team | ITER Connect",
    description: "Meet the passionate team behind ITER Connect. Learn about our mission to help students collaborate, innovate, and grow together in the tech community.",
  }
};

const ExploreLayout = (props) => {
  return <div>{props.children}</div>;
};

export default ExploreLayout;
