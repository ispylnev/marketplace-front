import Hero from '../components/Hero';
import Categories from '../components/Categories';
import FeaturedProducts from '../components/FeaturedProducts';

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="h-4 bg-white"></div>
      <Hero />
      <Categories />
      <FeaturedProducts />
    </div>
  );
};

export default Home;
