// import { useEffect, useState } from "react";

// https://kongmunist.medium.com/accessing-the-iphone-accelerometer-with-javascript-in-ios-14-and-13-e146d18bb175

const Accelerometer = () => {
  // const [x, setX] = useState(0);
  // const [y, setY] = useState(0);
  // const [z, setZ] = useState(0);

  // useEffect(() => {
  //   const acl = new Accelerometer({ frequency: 60 });

  //   acl.addEventListener("reading", () => {
  //     setX(acl.x);
  //     setY(acl.y);
  //     setZ(acl.z);
  //   });

  //   acl.start();
  // }, []);

  return (
    <div>
      {
        /* <p>X: {x}</p>
      <p>Y: {y}</p>
      <p>Z: {z}</p> */
      }
    </div>
  );
};

export default Accelerometer;
