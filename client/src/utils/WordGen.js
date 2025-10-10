const handleSend = async (lang) => {  
    console.log(lang);
    console.log('handleSend');
    try {
       const startTime__ = performance.now();
       let url=null;
       if (lang === "EN"){

        url ='http://localhost:5000/get-reply'
       }
       else{
        url = 'http://localhost:5000/get-reply-fa'
      }
      const response = await fetch(url, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: null
       });
       



       const data = await response.json();
       
       const endTime__ = performance.now();

       // console.log(`Execution time: ${(endTime__ - startTime__)} milliseconds`);
      return(data);
      
    } catch (err) {
      console.error('Error:', err);
    } finally {
      // setIsLoading(false); // Stop loading regardless of success or failure
      // Clear input and attachments
      // setUserInput('');
      // setAttachedVoices([]);
      // setCurrentAttachments([]);
    }
  };

export default handleSend;
// }


