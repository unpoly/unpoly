console.log("testDecorator loaded with new signature 3")

function testDecorator() {
  console.log("testDecorator returning function")
  return function(target, propertyKey, descriptor) {
    // target is the constructor function's { prototype }
    console.log("testDecorator:", {target, propertyKey, descriptor})
  }
}

export default testDecorator
