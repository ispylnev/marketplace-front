import irisImage from '../assets/87e79e75714afaa161e05a571ca2d52d623b3da0.png';
import succulentsImage from '../assets/889d6c254004778870a70d991285b570401e5625.png';
import aglaonemaImage from '../assets/edede5ec521bf123dc452869697a1da652638ebf.png';
import rosesImage from '../assets/fc77825ae35f7b3de820d7b8519acd36b843b53b.png';
import orchidsImage from '../assets/a3565728ee756ad8a73b7c0ef749167ad0757842.png';
import ficusImage from '../assets/a522e10182dc3cfa749b0aebde64f00ccca7991d.png';
import cactusImage from '../assets/541f6b38d53c36a0350acb27b2be4a869e5a8ca0.png';
import fernImage from '../assets/38df49c99f6c6be4e07feddb3828cca69236fedb.png';
import monsteraImage from '../assets/cc46ea59f21daf56327d6ba1ab3185b827a64111.png';

interface Plant {
  id: number;
  image: string;
  name: string;
}

export function PlantCollection() {
  const plants: Plant[] = [
    {
      id: 1,
      image: irisImage,
      name: "Ирисы"
    },
    {
      id: 2,
      image: succulentsImage,
      name: "Суккуленты"
    },
    {
      id: 3,
      image: aglaonemaImage,
      name: "Аглаонемы"
    },
    {
      id: 4,
      image: rosesImage,
      name: "Розы"
    },
    {
      id: 5,
      image: orchidsImage,
      name: "Орхидеи"
    },
    {
      id: 6,
      image: ficusImage,
      name: "Фикусы"
    },
    {
      id: 7,
      image: cactusImage,
      name: "Кактусы"
    },
    {
      id: 8,
      image: fernImage,
      name: "Папоротники"
    },
    {
      id: 9,
      image: monsteraImage,
      name: "Монстеры"
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-5">
      <h2 className="text-[#2B4A39] text-2xl font-bold mb-4">Моя коллекция</h2>
      
      {/* Сетка 3x3 */}
      <div className="grid grid-cols-3 gap-3">
        {plants.map((plant) => (
          <div key={plant.id} className="flex flex-col items-center">
            <div className="group cursor-pointer w-[81%]">
              <div className="w-full aspect-square rounded-lg overflow-hidden mb-1.5 border-2 border-[#BCCEA9] hover:border-[#2B4A39] transition-colors">
                <img 
                  src={plant.image} 
                  alt={plant.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <p className="text-center text-[#2D2E30] text-xs">{plant.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

