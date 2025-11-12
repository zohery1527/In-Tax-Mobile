
const Card = ({ title, value }) => (
  <div className="bg-white shadow rounded p-4 flex flex-col items-center justify-center">
    <h3 className="text-lg font-medium">{title}</h3>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

export default Card;
