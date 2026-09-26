// 本地编造的文章数据（临时替代后端接口）
// TODO: 接入后端后，删除本文件并将 useArticleStore 恢复为 getArticlePage / getArticleCategories 调用。
import { ArticleCategory } from '@/types'
import type { Article } from '@/types'
import type { CategoryVo } from '@/api/types'

export const mockArticle: Article = {
  id: 'local-dit-2024-001',
  common: {
    category: ArticleCategory.DIT,
    link: '',
    coverImage:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80',
    date: '2024-03-12',
    images: [
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1633412802994-5c058f151b66?auto=format&fit=crop&w=1400&q=80'
    ]
  },
  zh: {
    title: 'Diffusion Transformer 是如何重塑视觉生成的',
    content:
      '过去两年，扩散模型（Diffusion Model）彻底改变了图像与视频生成的范式。而从 U-Net 架构迈向 Diffusion Transformer（DiT）的这一步，被视为视觉生成领域的分水岭。\n\nDiT 的核心思想，是用标准的 Transformer 编码器替换传统扩散模型中笨重的 U-Net 主干。在潜在空间（latent space）中，图像被切分为一系列的 token，再交由自注意力机制建模全局依赖。这让模型在放大分辨率时依然保持稳定的训练效率。\n\n与卷积相比，Transformer 的可扩展性（scaling law）更为显著：当参数量、数据量和计算量同步增长时，生成质量几乎呈可预测的上升曲线。这也是 Sora 等视频生成系统选择 DiT 作为 backbone 的根本原因。\n\n当然，DiT 并非没有代价。自注意力对长序列的计算复杂度是二次方的，这意味着在生成长视频时需要配合时空分块、分布式训练与高效的采样器（如 DDIM、DPM-Solver）才能落地。\n\n可以预见，随着硬件与算法的协同演进，Diffusion Transformer 将成为多模态内容创作的基础设施，而理解它的工作原理，是每一个创作者与工程师的必修课。'
  },
  en: {
    title: 'How Diffusion Transformers Are Reshaping Visual Generation',
    content:
      'Over the past two years, diffusion models have fundamentally changed the paradigm of image and video generation. The shift from U-Net backbones to the Diffusion Transformer (DiT) is widely regarded as a watershed moment in visual synthesis.\n\nThe core idea of DiT is to replace the heavy U-Net backbone of a traditional diffusion model with a standard Transformer encoder. In the latent space, an image is decomposed into a sequence of tokens, which are then processed by self-attention to model global dependencies. This allows the model to scale to higher resolutions with stable training efficiency.\n\nCompared with convolutions, Transformers exhibit far more pronounced scaling laws: as parameters, data, and compute grow together, generation quality improves along a highly predictable curve. This is precisely why video generation systems such as Sora adopt DiT as their backbone.\n\nOf course, DiT is not without cost. Self-attention scales quadratically with sequence length, which means long-form video generation requires spatiotemporal patching, distributed training, and efficient samplers such as DDIM and DPM-Solver to become practical.\n\nLooking ahead, as hardware and algorithms co-evolve, the Diffusion Transformer will become core infrastructure for multimodal content creation, and understanding how it works is a must for every creator and engineer.'
  }
}

export const mockCategories: CategoryVo[] = [
  {
    value: 'DiT',
    sort: 0,
    zh: { label: 'DiT', shortLabel: 'DiT' },
    en: { label: 'DiT', shortLabel: 'DiT' }
  },
  {
    value: 'TALK',
    sort: 1,
    zh: { label: '瞎叨be叨', shortLabel: '叨' },
    en: { label: 'TALK', shortLabel: 'TALK' }
  }
]
