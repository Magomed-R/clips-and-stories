import { config } from "dotenv";
config();

import fs from "fs";
import { readdir } from "node:fs/promises";
import { exit } from "process";
import FormData from "form-data";
import axios from "axios";

const {
    bot_token,
    admin_chat_id,
    dir_path,
    group_id,
    group_shorts,
    vk_token,
    description,
    api_version,
    name,
    wallpost,
    quantity_token,
} = process.env;

async function post_store() {
    const video_files = await readdir(dir_path!);
    if (video_files.length === 0) {
        console.log("В директории Clips не найдены видео");
        exit();
    }
    
    const fileName = video_files[0];
    const file = fs.readFileSync(`${dir_path}/${fileName}`);
    const fileStats = fs.statSync(`${dir_path}/${fileName}`);

    console.log(`Начинается загрузка файла ${fileName}`)

    const reqGetServer = await axios.post(
        `https://api.vk.com/method/stories.getVideoUploadServer?add_to_news=1&v=${api_version}&file_size=${fileStats.size}&access_token=${vk_token}&group_id=${Number(group_id)}`,
        {
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + vk_token,
            },
        }
    );

    const upload_url = reqGetServer.data.response.upload_url;

    const form = new FormData();
    form.append("video_file", file, fileName);

    const reqUpload = await axios.post(upload_url, form, {
        headers: {
            "Content-Type": "multipart/form-data",
            Authorization: "Bearer " + vk_token,
        },
    });

    const upload_result = reqUpload.data.response.upload_result;

    await axios.post(
        `https://api.vk.com/method/stories.save?upload_results=${upload_result}&v=${api_version}&access_token=${vk_token}`
    );

    const reqForClip = await axios.post(`https://api.vk.com/method/shortVideo.create?v=${api_version}&access_token=${vk_token}&wallpost=1&group_id=${group_id}&description=${description}&name=${name}&file_size=${fileStats.size}`, {
        v: api_version,
        wallpost: wallpost,
        description: description,
        file_size: fileStats.size,
        access_token: vk_token,
        group_id: group_id,
    })
    
    const uploadUrlForClip = reqForClip.data.response.upload_url

    const formData = new FormData();
    formData.append('file', file, {
        filename: 'untitled.mp4',
        contentType: 'video/mp4'
    });

    const headers = formData.getHeaders();
    headers['user-agent'] = 'vk-test-clip-upload 1';

    await axios.post(uploadUrlForClip, formData, { headers: headers })

    console.log("Загрузка завершена");
}

post_store();
