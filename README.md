# HydraAI

A framework to generate a user interface with AI inside your production app.

## What is it?
It’s a framework and component library for building AI-generated components inside a React app.

## How is this different from V0?
V0 generates a “static” component you can copy into your project. This is useful for a developer “designing” the app but not helpful if you need to generate it in production.

## Why do you need this?
Chat interfaces are a paradigm shift in UI. Allowing people to interact with technology through natural language. While this is a vast improvement for many user experiences, not every interface is improved with natural language.

HydraAI is a way to give AI models the ability to generate user experiences in your app.

## What are some use cases for HydraAI?
* Excepting structured data.
* Collecting sensitive data that shouldn’t pass to an AI model.
* Displaying visual information: graphs, tables, images, etc.

## How to start the project

To get started with HydraAI, follow these steps:

1. **Clone the repository:**
   ```sh
   git clone https://github.com/michaelmagan/hydraai.git
   cd hydraai
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Add your .env variables:**
   Copy the `.env.example` file to `.env.local` and update the `OPENAI_API_KEY` with your actual API key.
   ```sh
   cp demo/frontend-hydra-demo/.env.example demo/frontend-hydra-demo/.env.local
   # Open .env.local and replace "YOUR_OPENAI_API_KEY" with your actual API key
   ```

4. **Run the development server:**
   ```sh
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000` to see the application running.

Note: To get full use of tailwinds classes you need to have tailwinds generate all the classes and it can take up to 20s per compilation...

When developing locally you can comment out:
```
  // safelist: [
  //   {
  //     pattern: /./, // the "." means "everything"
  //   },
  // ],
```
but not all tailwinds stylings will work.


By following these steps, you will have HydraAI up and running on your local machine. For more detailed instructions, refer to the project's documentation.
