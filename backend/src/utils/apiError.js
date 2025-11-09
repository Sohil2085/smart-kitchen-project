class apiError extends Error {
    constructor(
        message = "Something Went Wrong",
        statusCode = 500,
        errors = [],
        stack = ""
    ){
        super(message)
        this.name = 'apiError'
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false
        this.errors = errors

        if(stack) {
            this.stack = stack
        }
        else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export {apiError}