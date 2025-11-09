import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"//file system red,write,permission etc..
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } from "../../constant.js";

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
});

const uploadCloudinary = async (localFilePath) => {

    try {
        if(!localFilePath) return null
        //upload the file in cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type : 'auto'
        })
        //file has been successfull uploaded
        // console.log("file successfully uploaded",response.url)
        fs.unlinkSync(localFilePath)//remove locally file
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath)//remove locally file 
        return null;
    }

}

export {uploadCloudinary}