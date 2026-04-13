/*
In an async handling work we have to write try-catch OR Promise.then().catch() code. 
Instead of writing it everywhere we make a generalized function that contains generalized try-catch.
This generalized function is written in this utils.
*/


// There are 2 standard practices for this task::

//First Approach ::(Try-catch)


/* 
In this Approach we are using High order functions.
High Ordr=er functions : A function that functions as a argument and return another functions.
*/

// const asyncHandler = (fun) => {() => {}}   For unf=derstanding

// const asyncHandler = (fun) => async (req, res, next) => {
//     try {
//         await fun(req, res, next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }




//Second Approach :: (promise valo)

const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}

export {asyncHandler};