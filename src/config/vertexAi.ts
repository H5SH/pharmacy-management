import { VertexAI } from '@google-cloud/vertexai';

const projectId = process.env.REACT_APP_GOOGLE_CLOUD_PROJECT_ID;
const location = process.env.REACT_APP_GOOGLE_CLOUD_LOCATION || 'us-central1';

export const vertexAi = new VertexAI({
  project: projectId,
  location: location,
});

export const model = vertexAi.getGenerativeModel({ model: "gemini-1.5-flash" });