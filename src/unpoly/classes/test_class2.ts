import testDecorator from './test_decorator'


console.log("after import2")

class TestClass2 {

    @testDecorator()
    meth() {
        console.log("meth called")
    }

}


up.TestClass2 = TestClass2

