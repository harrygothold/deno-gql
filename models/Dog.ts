import { Model, DataTypes } from 'https://deno.land/x/denodb/mod.ts';

class Dog extends Model {
  static table = 'dogs';

  static fields = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING,
      length: 25,
    },
    breed: {
      type: DataTypes.STRING,
    },
  };
}

export default Dog;
