// trả về ở controller khi thành công
export const success = (res,data,message ='success',status=200) => {
    return res.status(status).json({
        success: true,
        message,
        data
    })
}