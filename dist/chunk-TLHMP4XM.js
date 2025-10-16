// src/core/serializer.ts
import superjson from "superjson";
var serializer = {
  serialize(data) {
    return superjson.stringify(data);
  },
  deserialize(data) {
    return superjson.parse(data);
  },
  serializeForQuery(data) {
    return encodeURIComponent(superjson.stringify(data));
  },
  deserializeFromQuery(data) {
    return superjson.parse(decodeURIComponent(data));
  }
};

export {
  serializer
};
//# sourceMappingURL=chunk-TLHMP4XM.js.map