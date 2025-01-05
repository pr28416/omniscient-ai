import { Message } from "./chat/schemas";

export const testMessages: Message[] = [
  {
    userMessage: { content: "What is the best way to learn React?" },
    assistantMessage: {
      searchQueries: [
        "React tutorials",
        "React best practices",
        "Learn React for beginners",
      ],
      isDoneGeneratingSearchQueries: true,
      isDonePerformingSearch: true,
      searchResults: {
        web: {
          results: [
            {
              url: "https://react.dev/learn",
              title: "Quick Start – React Documentation",
              description:
                "Official React documentation providing step-by-step guidance for beginners to learn React fundamentals.",
              profile: {
                name: "React",
                img: "https://static.cdnlogo.com/logos/g/35/google-icon.svg",
              },
            },
            {
              url: "https://roadmap.sh/react",
              title: "React Developer Roadmap",
              description:
                "A comprehensive roadmap for learning React, including prerequisites and advanced concepts.",
              profile: {
                name: "React",
                img: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1024px-React-icon.svg.png",
              },
            },
          ],
        },
      },
      isDoneProcessingSearchResults: true,
      processedSearchResults: [
        {
          scrapeStatus: "success",
          source: {
            url: "https://react.dev/learn",
            title: "Quick Start - React Documentation",
            summary:
              "Official React documentation providing step-by-step guidance for beginners to learn React fundamentals.",
            favicon: "https://static.cdnlogo.com/logos/g/35/google-icon.svg",
            sourceNumber: 1,
          },
        },
        {
          scrapeStatus: "error",
          source: {
            url: "https://roadmap.sh/react",
            title: "React Developer Roadmap",
            favicon:
              "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1024px-React-icon.svg.png",
            sourceNumber: 2,
          },
          error: "Error while reading: Testing error.",
        },
        {
          scrapeStatus: "in-progress",
          source: {
            url: "https://beta.reactjs.org/learn",
            title: "Learn React - Beta Documentation",
            favicon: "https://beta.reactjs.org/favicon.ico",
            sourceNumber: 3,
          },
        },
        {
          scrapeStatus: "not-started",
          source: {
            url: "https://react-tutorial.app",
            title: "Interactive React Tutorial",
            favicon:
              "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQoRUg0l7PMuv1byhqZ90_i41rtCfjKYpjFeA&s",
            sourceNumber: 4,
          },
        },
      ],
      isDoneGeneratingFinalAnswer: true,
      finalAnswer:
        "Here's an example of inline math: \\(f(x) = \\frac{1}{\\sqrt{2\\pi}} e^{-\\frac{x^2}{2}}\\). Here's an example of non-inline math: \\[\\int_{-\\infty}^{ \\infty} f(x) dx = 1\\]\n\nHere's more math: \\[\nf(x) = x^2\n\\]\n\nHere's a link: [Test link] [](https://science.nasa.gov/moon/lunar-phases-and-eclipses/#:~:text=These%20continually%20changing%20views%20of,month%20(every%2029.5%20days))",
      followUpSearchQueries: [
        "React tutorials",
        "React best practices",
        "React tutorials",
      ],
      processedImageSearchResults: [
        {
          scrapeStatus: "not-started",
          source: {
            sourceNumber: 1,
            title: "Example 1",
            imgUrl:
              "https://d2u1z1lopyfwlx.cloudfront.net/thumbnails/3fc9f0ad-4ab4-531f-a148-529b9a87cf70/e91e73d4-022b-59db-9713-717a2a198855.jpg",
            thumbnailUrl:
              "https://d2u1z1lopyfwlx.cloudfront.net/thumbnails/3fc9f0ad-4ab4-531f-a148-529b9a87cf70/e91e73d4-022b-59db-9713-717a2a198855.jpg",
            webUrl: "https://react.dev",
            summary:
              "(Summary 1) Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
          },
        },
        {
          scrapeStatus: "in-progress",
          source: {
            sourceNumber: 2,
            title: "Example 2",
            imgUrl:
              "https://images.photowall.com/products/42556/summer-landscape-with-river.jpg?h=699&q=85",
            thumbnailUrl:
              "https://images.photowall.com/products/42556/summer-landscape-with-river.jpg?h=699&q=85",
            webUrl: "https://instagram.com",
            summary:
              "(Summary 2) Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
          },
        },
        {
          scrapeStatus: "success",
          source: {
            sourceNumber: 3,
            title: "Example 3",
            imgUrl:
              "https://imageio.forbes.com/blogs-images/tomcoughlin/files/2016/07/Electronic-Functions-in-Cars-1200x758.png?format=png&height=900&width=1600&fit=bounds",
            thumbnailUrl:
              "https://imageio.forbes.com/blogs-images/tomcoughlin/files/2016/07/Electronic-Functions-in-Cars-1200x758.png?format=png&height=900&width=1600&fit=bounds",
            webUrl: "https://reddit.com",
            summary:
              "(Summary 3) Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
          },
        },
        {
          scrapeStatus: "error",
          source: {
            sourceNumber: 4,
            title: "Example 4",
            imgUrl:
              "https://media.istockphoto.com/id/485371557/photo/twilight-at-spirit-island.jpg?s=612x612&w=0&k=20&c=FSGliJ4EKFP70Yjpzso0HfRR4WwflC6GKfl4F3Hj7fk=",
            thumbnailUrl:
              "https://media.istockphoto.com/id/485371557/photo/twilight-at-spirit-island.jpg?s=612x612&w=0&k=20&c=FSGliJ4EKFP70Yjpzso0HfRR4WwflC6GKfl4F3Hj7fk=",
            webUrl: "https://apple.com",
            summary:
              "(Summary 4) Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
          },
        },
        {
          scrapeStatus: "success",
          source: {
            sourceNumber: 5,
            title: "Example 5",
            imgUrl:
              "https://images.pexels.com/photos/346529/pexels-photo-346529.jpeg?cs=srgb&dl=pexels-bri-schneiter-28802-346529.jpg&fm=jpg",
            thumbnailUrl:
              "https://images.pexels.com/photos/346529/pexels-photo-346529.jpeg?cs=srgb&dl=pexels-bri-schneiter-28802-346529.jpg&fm=jpg",
            webUrl: "https://google.com",
            summary:
              "(Summary 5) Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
          },
        },
      ],
    },
  },
];
