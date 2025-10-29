import axios from "axios";
import { useEffect, useState } from "react";

interface SeenIndex {
  number: number;
}

function Fib() {
  const [seenIndexes, setSeenIndexes] = useState<SeenIndex[]>([]);
  const [values, setValues] = useState<{ [key: string]: number }>({});
  const [index, setIndex] = useState("");

  const fetchValues = async () => {
    try {
      const values = await axios.get("/api/values/current");
      setValues(values.data);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchIndexes = async () => {
    try {
      const seenIndexes = await axios.get("/api/values/all");
      setSeenIndexes(seenIndexes.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchValues();
    fetchIndexes();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await axios.post("/api/values", {
        index: index,
      });

      setIndex("");

      await Promise.all([fetchIndexes(), fetchValues()]);
    } catch (error) {
      console.log(error);
    }
  };

  const renderSeenIndexes = () => {
    return seenIndexes.map(({ number }) => number).join(", ");
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label htmlFor="">Enter your index:</label>
        <input
          type="number"
          onChange={(e) => setIndex(e.target.value)}
          value={index}
        />
        <button type="submit">Submit</button>
      </form>

      <h3>Indexes I have seen:</h3>
      {seenIndexes.length > 0 && renderSeenIndexes()}

      <h3>Calculated Values:</h3>
      {Object.keys(values).map((key) => (
        <div key={key}>
          For index {key} I Calculated {values[key]}
        </div>
      ))}
    </div>
  );
}

export default Fib;
