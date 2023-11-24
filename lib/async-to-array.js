let array = [];

export default async (iterator) => {
  for await (
    const response of iterator
  ) {
    array = [
      ...array,
      response,
    ]
  }
  return array;
}
