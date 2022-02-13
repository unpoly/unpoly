import testDecorator from './test_decorator'


console.log("after import2")

class TestClass {

  @testDecorator()
  meth() {
    console.log("meth called")
  }

}


up.TestClass = TestClass
