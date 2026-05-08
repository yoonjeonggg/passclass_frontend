import React from 'react';
import { Link } from 'react-router-dom';
import type { LectureListDto } from '../types';
import { IconStar, IconUsers } from './Icons';
import './LectureCard.css';

interface Props { lecture: LectureListDto; }

export default function LectureCard({ lecture }: Props) {
  return (
    <Link to={`/lectures/${lecture.id}`} className="lecture-card">
      <div className="lc-thumb">
        {lecture.thumbnailUrl
          ? <img src={lecture.thumbnailUrl} alt={lecture.title} />
          : <div className="lc-thumb-placeholder">
              <span>{lecture.title.slice(0, 2)}</span>
            </div>
        }
        {lecture.category && <span className="lc-category">{lecture.category}</span>}
      </div>

      <div className="lc-body">
        {lecture.certificate && (
          <div className="lc-cert">{lecture.certificate.name}</div>
        )}
        <h3 className="lc-title">{lecture.title}</h3>
        <div className="lc-meta">
          <div className="lc-rating">
            <IconStar size={13} filled className="lc-star" />
            <span>{(lecture.rating || 0).toFixed(1)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
