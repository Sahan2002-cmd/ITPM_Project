const BASE_URL = "https://localhost:44331/api";

const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

const handleResponse = async (res) => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.Message || data.message || `HTTP ${res.status}`);
    return data;
};

export const uploadRecording = async (recordingData) => {
    const res = await fetch(`${BASE_URL}/recording/upload`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(recordingData),
    });
    return handleResponse(res);
};

export const getStudentRecordings = async (studentId) => {
    const res = await fetch(`${BASE_URL}/recording/student/${studentId}`, {
        headers: getAuthHeaders(),
    });
    return handleResponse(res);
};

export const getRecordingById = async (id) => {
    const res = await fetch(`${BASE_URL}/recording/${id}`, {
        headers: getAuthHeaders(),
    });
    return handleResponse(res);
};
