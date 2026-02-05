import { X } from "lucide-react";

const ShowImage = ({ imageBase64, timestamp, onClose }) => {
  if (!imageBase64) return null;

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl w-full max-w-xl border border-slate-700 animate-slideUp flex flex-col">
     
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-slate-300">
          🖼️ Generated Diagram
        </h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-2 hover:bg-slate-700 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

     
      <div className="p-4 flex-1 overflow-auto bg-white rounded-b-2xl">
        <img
          src={`data:image/png;base64,${imageBase64}`}
          alt="Generated Diagram"
          className="w-full h-auto object-contain"
        />
      </div>

      
      <div className="bg-slate-900 p-3 flex justify-end rounded-b-2xl">
        <a
          href={`data:image/png;base64,${imageBase64}`}
          download={`diagram-${timestamp}.png`}
          className="text-xs text-blue-400 hover:text-blue-300 font-bold uppercase"
        >
          Download ⬇️
        </a>
      </div>
    </div>
  );
};

export default ShowImage;
