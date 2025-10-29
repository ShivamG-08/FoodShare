import React from 'react';
import { useParams, Link } from 'react-router-dom';
import './StoryDetails.css';

// Sample story data - in a real app, this would come from an API
const stories = {
  'bringing-smiles-to-families': {
    id: 'bringing-smiles-to-families',
    title: 'Bringing Smiles to Families',
    date: 'October 15, 2023',
    author: 'FoodShare Team',
    location: 'New York, NY',
    image: '/Families.jpg',
    content: [
      'Thanks to our generous donors and dedicated volunteers, we were able to provide nutritious meals to over 100 families in need last month. This initiative was part of our ongoing effort to combat food insecurity in the New York metropolitan area.',
      'The event brought together local restaurants, community organizations, and volunteers who worked tirelessly to prepare and distribute meals. Each family received a week\'s worth of fresh, healthy food, along with recipes and nutritional information.',
      'One recipient, Maria G., shared her story: "As a single mother of three, it\'s been challenging to make ends meet. The food we received from FoodShare has been a blessing. My children are eating better, and I\'m so grateful for the support."',
      'Our goal is to expand this program to reach even more families in the coming months. With your continued support, we can make a real difference in the lives of those facing food insecurity.'
    ]
  },
  'community-coming-together': {
    id: 'community-coming-together',
    title: 'Community Coming Together',
    date: 'September 28, 2023',
    author: 'FoodShare Team',
    location: 'Chicago, IL',
    image: '/community.jpg',
    content: [
      'Last month, our Chicago chapter witnessed an incredible display of community spirit as local restaurants, volunteers, and organizations came together to distribute over 500 meals to the homeless community in the downtown area.',
      'The event, held in partnership with several local shelters, provided hot meals, fresh produce, and essential supplies to those in need. Volunteers from all walks of life dedicated their time to prepare, package, and distribute the food.',
      '"I\'ve been volunteering with FoodShare for six months now, and every event reminds me of the power of community," said James T., one of our regular volunteers. "Seeing the gratitude on people\'s faces makes it all worthwhile."',
      'We\'re proud to report that this initiative has helped reduce food waste in the area by 30% while ensuring that those who need it most have access to nutritious meals. Our work continues, and we invite you to join us in making a difference.'
    ]
  }
};

function StoryDetails() {
  const { storyId } = useParams();
  const story = stories[storyId];

  if (!story) {
    return (
      <div className="story-not-found">
        <h2>Story Not Found</h2>
        <p>The story you're looking for doesn't exist or has been removed.</p>
        <Link to="/" className="btn primary">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="story-details">
      <div className="story-header">
        <div className="container">
          <Link to="/#stories" className="back-link">← Back to Stories</Link>
          <h1>{story.title}</h1>
          <div className="story-meta">
            <span className="date">{story.date}</span>
            <span className="location">{story.location}</span>
          </div>
        </div>
      </div>
      
      <div className="story-content container">
        <div className="story-image">
          <img src={story.image} alt={story.title} />
        </div>
        
        <div className="story-text">
          {story.content.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
          
          <div className="story-actions">
            <button 
              className="btn primary"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Back to Top
            </button>
            <Link to="/#contact" className="btn secondary">
              Share Your Story
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StoryDetails;
