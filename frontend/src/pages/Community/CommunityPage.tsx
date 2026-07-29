import React, { useState } from 'react';
import { Users, ThumbsUp, MessageSquare, Plus } from 'lucide-react';

const CommunityPage: React.FC = () => {
  const [posts, setPosts] = useState([
    { id: '1', title: 'Pune Cleanliness drive in Erandwane ward this Saturday', content: 'Volunteers required to assemble near Kamala Nehru Park at 7 AM. Gloves and bags will be supplied by local corporators.', upvotes: 24, replies: 6, author: 'Suresh Rao' },
    { id: '2', title: 'Blood Donation Camp by Pune Red Cross at Swargate', content: 'Urgent demand for O-ve and AB+ve groups. Please visit the community center between 9 AM and 5 PM.', upvotes: 42, replies: 12, author: 'Dr. Anita Patil' },
  ]);

  const handleUpvote = (id: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, upvotes: p.upvotes + 1 } : p))
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Community Safety & Volunteer Forums</h1>
          <p className="text-slate-500 text-sm mt-1">
            Connect with other local citizens, coordinate volunteer relief work, share announcements, or register for local festivals.
          </p>
        </div>
        <button className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-md3 font-semibold shadow-sm flex items-center gap-1.5 hover-scale">
          <Plus className="w-5 h-5" /> Start Discussion
        </button>
      </div>

      <div className="space-y-6 max-w-4xl">
        {posts.map((post) => (
          <div key={post.id} className="bg-white p-6 rounded-md3 border border-slate-border shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-1.5">
                <Users className="w-5 h-5 text-primary" />
                {post.title}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">{post.content}</p>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-xs text-slate-400 font-semibold">
              <span>Author: {post.author}</span>
              <div className="flex gap-4">
                <button onClick={() => handleUpvote(post.id)} className="flex items-center gap-1 hover:text-primary transition-colors">
                  <ThumbsUp className="w-4 h-4" /> Upvote ({post.upvotes})
                </button>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" /> Comments ({post.replies})
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityPage;
