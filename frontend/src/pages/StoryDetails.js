import React from 'react';
import { useParams, Link } from 'react-router-dom';
import './StoryDetails.css';

// Sample story data - in a real app, this would come from an API
const stories = {
  'nourishing-mumbai-communities': {
    id: 'nourishing-mumbai-communities',
    title: 'Nourishing Mumbai Communities',
    date: 'October 15, 2023',
    author: 'FoodShare India Team',
    location: 'Mumbai, Maharashtra',
    image: '/Families.jpg',
    content: [
      'Thanks to our generous donors and dedicated volunteers, we successfully provided nutritious meals to over 500 families in need across Mumbai last month. This initiative is part of our commitment to combat food insecurity in urban India.',
      'The event united local dabbawalas, community kitchens (dabbas), and volunteers who worked tirelessly to prepare and distribute traditional Indian meals. Each family received a week\'s worth of fresh, locally-sourced food, along with recipes using regional ingredients.',
      'One recipient, Sunita P. from Dharavi, shared her story: "As a mother of four, it\'s been difficult to provide proper meals every day. The food we received from FoodShare has been a blessing. My children are now getting balanced meals with dal, roti, and vegetables regularly."',
      'Our goal is to expand this program to reach 10,000 families across India by next year. With your continued support, we can make a significant impact on food security in our communities.'
    ]
  },
  'rural-reach-initiative': {
    id: 'rural-reach-initiative',
    title: 'Rural Reach: Feeding Villages',
    date: 'September 28, 2023',
    author: 'FoodShare India Team',
    location: 'Maharashtra Villages',
    image: '/community.jpg',
    content: [
      'Last month, our Rural Reach Initiative successfully provided meals to over 2,000 people across 15 villages in Maharashtra. This program focuses on addressing malnutrition in rural India through sustainable food distribution.',
      'Working with local self-help groups and anganwadi centers, we distributed nutrient-rich khichdi, fortified with local grains and pulses. The initiative also included nutrition education sessions for mothers and caregivers.',
      '"I\'ve been volunteering with FoodShare India for a year now, and the impact we\'ve made in these villages is incredible," said Priya M., our field coordinator. "The smiles on the children\'s faces when they receive a hot meal make every effort worthwhile."',
      'We\'re proud to report that this initiative has helped reduce food waste by connecting surplus farm produce from local farmers to communities in need. Our work continues, and we invite you to join us in making a difference across rural India.'
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
